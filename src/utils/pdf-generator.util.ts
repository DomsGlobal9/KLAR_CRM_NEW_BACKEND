// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const generatePdfFromHtml = async (templateName: string, data: any): Promise<Buffer> => {
//     // 1. Load the HTML template (Create a 'templates' folder in src)
//     const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
//     const htmlContent = fs.readFileSync(templatePath, 'utf-8');

//     // 2. Compile and inject dynamic data
//     const template = handlebars.compile(htmlContent);
//     const finalHtml = template(data);

//     // 3. Launch Puppeteer to print PDF
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();
    
//     await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
//     const pdfBuffer = await page.pdf({ 
//         format: 'A4', 
//         printBackground: true,
//         margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
//     });

//     await browser.close();
//     return Buffer.from(pdfBuffer);
// };



import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const generatePdfFromHtml = async (templateName: string, data: any): Promise<Buffer> => {
    // Path to your HTML templates
    const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }

    const htmlContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(htmlContent);
    const finalHtml = template(data);

    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
};