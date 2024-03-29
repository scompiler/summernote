const { readdirSync, readFileSync, existsSync } = require('fs');
const glob = require('glob');
const path = require('path');

const defaultStyle = 'teaks';

const plugins = readdirSync('./plugin', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => {
    const id = dirent.name;

    if (!existsSync(`./plugin/${id}/summernote-ext-${id}.ts`)) {
      return null;
    }

    return {
      id,
    };
  })
  .filter(plugin => plugin !== null);

module.exports = {
  defaultStyle,
  // Styles in /src/styles
  // Each entity becomes an entry point in Webpack build process.
  styles:
    readdirSync('./src/styles', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name != 'summernote')
      .map(dirent => {
        const id = dirent.name;
        const target = id === defaultStyle ? 'summernote' : `summernote-${id}`;
        let name;

        // Try to find information json file and get them.
        try {
          let info = JSON.parse(readFileSync(`./src/styles/${id}/summernote-${id}.json`));
          name = info.name || id;
        } catch {
          name = id;
        }

        const extension = existsSync(`./src/styles/${id}/summernote-${id}.ts`) ? 'ts' : 'js';

        return { id, name, target, extension };
      }),

  plugins: plugins,

  // Translation files in /src/locales
  languages: glob.sync('./src/lang/*.{js,ts}').map(name => ({
    name: path.basename(name, path.extname(name)),
    filename: path.basename(name),
  })),

  // Regard all html files in examples directory as examples
  examples:
    glob.sync('./examples/*.html')
      .filter(f => f.charAt(0) != '_') // except files start with underscore
      .map(filepath => {
        let title;
        let name = path.parse(filepath).name;

        // Try to parse html and get <title> from it.
        try {
          let html = readFileSync(filepath).toString();
          title = html.match(/<title[^>]*>([^<]+)<\/title>/)[1];
        } catch {
          title = name;
        }
        return { filepath, name, title };
      }),
};
