export enum HeadingLevel {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6',
}

export enum FontFamily {
  ARIAL = 'arial',
  SERIF = 'serif',
  MONO = 'mono',
  VERDANA = 'verdana',
  "TIMES NEW ROMAN" = 'times new roman',
  GEORGIA = 'georgia',
  MONTSERRAT = 'montserrat',
}

export enum FontSize {
  "12px" = 'xs',
  "14px" = 'sm',
  "16px" = 'base',
  "18px" = 'lg',
  "20px" = 'xl',
  "24px" = '2xl',
  "30px" = '3xl',
  "36px" = '4xl',
  "48px" = '5xl',
  "60px" = '6xl',
}

export enum ColorPalette {
  BLACK = '#000000',
  WHITE = '#FFFFFF',
  GRAY = '#6B7280',
  RED = '#EF4444',
  ORANGE = '#F97316',
  AMBER = '#F59E0B',
  YELLOW = '#EAB308',
  LIME = '#84CC16',
  GREEN = '#22C55E',
  EMERALD = '#10B981',
  TEAL = '#14B8A6',
  CYAN = '#06B6D4',
  SKY = '#0EA5E9',
  BLUE = '#3B82F6',
  INDIGO = '#6366F1',
  VIOLET = '#8B5CF6',
  PURPLE = '#A855F7',
  FUCHSIA = '#D946EF',
  PINK = '#EC4899',
  ROSE = '#F43F5E',
}

export enum TextAlignOption {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify',
}

export enum EditorCommand {
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKE = 'strike',
  CODE = 'code',
  HEADING = 'heading',
  BULLET_LIST = 'bulletList',
  ORDERED_LIST = 'orderedList',
  BLOCKQUOTE = 'blockquote',
  CODE_BLOCK = 'codeBlock',
  HIGHLIGHT = 'highlight',
  LINK = 'link',
  IMAGE = 'image',
  TABLE = 'table',
  TEXT_ALIGN = 'textAlign',
  TEXT_COLOR = 'textColor',
  TEXT_STYLE = 'textStyle',
  CLEAR_FORMAT = 'clearFormat',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum AIFeature {
  TEXT_COMPLETION = 'textCompletion',
  GRAMMAR_CHECK = 'grammarCheck',
  STYLE_SUGGESTIONS = 'styleSuggestions',
  CONTENT_SUMMARY = 'contentSummary',
  CODE_SUGGESTIONS = 'codeSuggestions',
}

export enum TableBorderStyle {
  NONE = 'none',
  SOLID = 'solid',
  DASHED = 'dashed',
  DOTTED = 'dotted',
  DOUBLE = 'double',
}

export enum ExportFormat {
  HTML = 'html',
  PDF = 'pdf',
  MARKDOWN = 'markdown',
}

export interface EditorState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  isCode: boolean;
  isHighlighted: boolean;
  headingLevel: HeadingLevel | null;
  textAlign: TextAlignOption;
  textColor: string;
  fontFamily: FontFamily;
  fontSize: FontSize;
  isLink: boolean;
  isImage: boolean;
  isTable: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isCodeBlock: boolean;
  isBlockquote: boolean;
}

export interface TableCell {
  content: string;
  rowSpan?: number;
  colSpan?: number;
  backgroundColor?: string;
  textAlign?: TextAlignOption;
}

export interface TableStyles {
  borderStyle: TableBorderStyle;
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
  backgroundColor?: string;
}

export interface MentionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CharacterCount {
  characters: number;
  words: number;
}

export interface SearchResult {
  from: number;
  to: number;
  text: string;
}
