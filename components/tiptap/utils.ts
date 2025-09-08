import parse, { HTMLReactParserOptions, Element } from 'html-react-parser';

type RenderOptions = {
  preserveStyles?: boolean;
  preserveLinks?: boolean;
};

export function renderHtmlAsJsx(html: string, options: RenderOptions = {}) {
  const transform: HTMLReactParserOptions['replace'] = (domNode) => {
    if (domNode.type === 'tag') {
      const el = domNode as Element;

      if (!options.preserveStyles) {
        // Remove estilos e classes
        if (el.attribs?.style) delete el.attribs.style;
        if (el.attribs?.class) delete el.attribs.class;

        // Tags que aplicam estilo visual por padrão
        const visuallyStyledTags = [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'b', 'strong', 'i', 'em', 'u', 'a',
        ];

        if (visuallyStyledTags.includes(el.name)) {
          // Se for link, remove também o href
          if (el.name === 'a' && el.attribs?.href) {
            delete el.attribs.href;
          }

          // Troca a tag por um span neutro
          return {
            ...el,
            name: 'span',
          };
        }
      }
    }
  };

  return parse(html, { replace: transform });
}




export const uploadImageFn = async (file: File) => {
  console.log('Upload file logic');

  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const imageUrl = URL.createObjectURL(file);
  return imageUrl;
};

export const deleteImageFn = async (url: string): Promise<any> => {
  console.log('Delete file logic', url);

  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return true;
};
