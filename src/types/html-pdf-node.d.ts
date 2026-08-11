declare module 'html-pdf-node' {
    export interface Options {
        args?: string[];
        format?: string;
        scale?: number;
        displayHeaderFooter?: boolean;
        headerTemplate?: string;
        footerTemplate?: string;
        printBackground?: boolean;
        landscape?: boolean;
        pageRanges?: string;
        width?: string | number;
        height?: string | number;
        margin?: {
            top?: string | number;
            right?: string | number;
            bottom?: string | number;
            left?: string | number;
        };
        path?: string;
        preferCSSPageSize?: boolean;
    }

    export interface FileContent {
        url?: string;
        content?: string;
    }

    export function generatePdf(
        file: FileContent,
        options?: Options
    ): Promise<Buffer>;

    export function generatePdfs(
        files: FileContent[],
        options?: Options
    ): Promise<Array<{ file: FileContent; buffer: Buffer }>>;
}
