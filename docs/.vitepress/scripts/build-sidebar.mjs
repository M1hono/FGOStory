import { getSidebar, getConfiguredLanguages, configureSidebar } from "../utils/sidebar/index.ts";
import { getLanguageLinks } from "../config/project-config.js";
import { getSrcPath, getVitepressPath } from "../utils/config/path-resolver.js";

async function buildSidebars() {
    console.log("🚀 Starting sidebar generation...");
    
    const languageLinks = getLanguageLinks();
    // Convert links like '/zh/', '/en/' to language codes like 'zh', 'en'
    const languages = languageLinks.map(link => link.replace(/^\/|\/$/g, ''));
    const srcPath = getSrcPath();
    const cachePath = getVitepressPath("cache/sidebar");
    
    configureSidebar({
        languages: languages,
        debug: process.env.NODE_ENV === 'development',
        rootDir: process.cwd(),
        docsDir: srcPath,
        cacheDir: cachePath,
    });
    
    const configuredLanguages = getConfiguredLanguages();
    console.log(`📚 Using configured languages: ${configuredLanguages.join(", ")}`);
    
    for (const lang of configuredLanguages) {
        console.log(`\n📖 Generating sidebar for language: ${lang || "root"}`);

        const sidebar = await getSidebar(lang);

        if (Object.keys(sidebar).length > 0) {
            console.log(
                `✅ Successfully generated sidebar for ${lang || "root"}`
            );
            console.log(`   Generated ${Object.keys(sidebar).length} route(s)`);

            for (const [route, items] of Object.entries(sidebar)) {
                console.log(`   📄 ${route}: ${items.length} item(s)`);
            }
        }
    }
}

buildSidebars();
