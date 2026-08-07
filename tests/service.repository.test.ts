import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Minimal Supabase query-builder stub. Records which table each query hit so we
 * can assert on query COUNT — the point of v1.4.0 is collapsing N + N×M round
 * trips into a fixed number.
 */
const { supabaseAdmin, state } = vi.hoisted(() => {
    const state = {
        queries: [] as string[],
        tables: {} as Record<string, any[]>,
    };

    const makeBuilder = (table: string) => {
        state.queries.push(table);

        const builder: any = {
            select: () => builder,
            eq: () => builder,
            in: () => builder,
            or: () => builder,
            limit: () => builder,
            range: () => builder,
            order: () => builder,
            // Awaiting the builder resolves it, mirroring PostgREST.
            then: (resolve: any) => resolve({ data: state.tables[table] || [], error: null }),
        };

        return builder;
    };

    return {
        supabaseAdmin: { from: (table: string) => makeBuilder(table) },
        state,
    };
});

vi.mock('../src/config', () => ({ supabaseAdmin, supabase: {} }));

import { serviceRepository } from '../src/repositories/service.repository';

const countQueriesTo = (table: string) =>
    state.queries.filter(t => t === table).length;

beforeEach(() => {
    state.queries = [];
    state.tables = {};
});

describe('getCategoryTreeByServiceIds — batching', () => {

    it('loads categories and sub-services for MANY services in 2 queries', async () => {
        state.tables['sub_service_categories'] = [
            { id: 'c1', service_id: 's1', display_order: 1 },
            { id: 'c2', service_id: 's1', display_order: 2 },
            { id: 'c3', service_id: 's2', display_order: 1 },
        ];
        state.tables['sub_services'] = [
            { id: 'ss1', sub_service_category_id: 'c1' },
            { id: 'ss2', sub_service_category_id: 'c1' },
            { id: 'ss3', sub_service_category_id: 'c3' },
        ];

        const tree = await serviceRepository.getCategoryTreeByServiceIds(
            ['s1', 's2', 's3'],
            true
        );

        // Previously: 3 category queries + 3 sub-service queries = 6.
        expect(countQueriesTo('sub_service_categories')).toBe(1);
        expect(countQueriesTo('sub_services')).toBe(1);

        expect(tree.get('s1')).toHaveLength(2);
        expect(tree.get('s2')).toHaveLength(1);
        expect(tree.get('s3')).toBeUndefined();
    });

    it('groups sub-services under the correct category', async () => {
        state.tables['sub_service_categories'] = [
            { id: 'c1', service_id: 's1' },
            { id: 'c2', service_id: 's1' },
        ];
        state.tables['sub_services'] = [
            { id: 'ss1', sub_service_category_id: 'c1' },
            { id: 'ss2', sub_service_category_id: 'c2' },
            { id: 'ss3', sub_service_category_id: 'c1' },
        ];

        const tree = await serviceRepository.getCategoryTreeByServiceIds(['s1'], true);
        const categories = tree.get('s1')!;

        expect(categories.find(c => c.id === 'c1')!.sub_services).toHaveLength(2);
        expect(categories.find(c => c.id === 'c2')!.sub_services).toHaveLength(1);
    });

    it('skips the sub-services query entirely when not requested', async () => {
        state.tables['sub_service_categories'] = [{ id: 'c1', service_id: 's1' }];

        const tree = await serviceRepository.getCategoryTreeByServiceIds(['s1'], false);

        expect(countQueriesTo('sub_services')).toBe(0);
        expect(tree.get('s1')![0].sub_services).toEqual([]);
    });

    it('issues no queries at all for an empty service list', async () => {
        const tree = await serviceRepository.getCategoryTreeByServiceIds([], true);

        expect(state.queries).toHaveLength(0);
        expect(tree.size).toBe(0);
    });

    it('skips the sub-services query when no categories exist', async () => {
        state.tables['sub_service_categories'] = [];

        const tree = await serviceRepository.getCategoryTreeByServiceIds(['s1'], true);

        expect(countQueriesTo('sub_services')).toBe(0);
        expect(tree.size).toBe(0);
    });

    it('gives categories with no sub-services an empty array, not undefined', async () => {
        state.tables['sub_service_categories'] = [{ id: 'c1', service_id: 's1' }];
        state.tables['sub_services'] = [];

        const tree = await serviceRepository.getCategoryTreeByServiceIds(['s1'], true);

        expect(tree.get('s1')![0].sub_services).toEqual([]);
    });
});

describe('getAllServicesWithRelationsMinimal — query count', () => {

    it('stays at a fixed query count as the number of services grows', async () => {
        state.tables['services'] = Array.from({ length: 25 }, (_, i) => ({ id: `s${i}` }));
        state.tables['sub_service_categories'] = Array.from({ length: 25 }, (_, i) => ({
            id: `c${i}`,
            service_id: `s${i}`,
        }));
        state.tables['sub_services'] = [];

        const result = await serviceRepository.getAllServicesWithRelationsMinimal({}, true, true);

        expect(result).toHaveLength(25);

        // 1 services + 1 categories + 1 sub_services. Was 1 + 25 + 25 = 51.
        expect(state.queries).toHaveLength(3);
    });

    it('does not query relations at all when sub-categories are not requested', async () => {
        state.tables['services'] = [{ id: 's1' }, { id: 's2' }];

        const result = await serviceRepository.getAllServicesWithRelationsMinimal({}, false, false);

        expect(state.queries).toEqual(['services']);
        expect(result[0].sub_service_categories).toEqual([]);
    });
});
