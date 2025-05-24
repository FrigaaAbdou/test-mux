import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Undo,
  Redo,
  RotateCcw,
  Type,
  Palette,
  Highlighter,
  Minus,
  Eraser,
  Type as FontIcon,
  Languages
} from 'lucide-react';
import './RichTextEditor.css';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const fonts = [
    { name: 'Default', value: 'Inter' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Noto Sans', value: 'Noto Sans' },
    { name: 'Noto Sans Arabic', value: 'Noto Sans Arabic' },
    { name: 'Noto Sans JP', value: 'Noto Sans JP' },
    { name: 'Noto Sans KR', value: 'Noto Sans KR' },
    { name: 'Noto Sans TC', value: 'Noto Sans TC' },
  ];

  const setDirection = (dir) => {
    const element = editor.view.dom;
    element.setAttribute('dir', dir);
    editor.commands.focus();
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];
  const highlightColors = ['#FFFF00', '#00FFFF', '#FF69B4', '#98FB98', '#DDA0DD'];

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="flex flex-wrap gap-0.5 p-2">
        {/* Font Family Dropdown */}
        <div className="relative group mr-2 border-r border-gray-300 pr-2">
          <div className="flex items-center gap-1">
            <FontIcon size={18} className="text-gray-700" />
            <select
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              className="h-8 px-2 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
            >
              {fonts.map((font) => (
                <option 
                  key={font.value} 
                  value={font.value}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Direction Controls */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => setDirection('ltr')}
            className={`p-2 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 ${
              editor.view.dom.dir === 'ltr' ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Left to Right"
          >
            <Languages size={18} />
            <span>LTR</span>
          </button>
          <button
            onClick={() => setDirection('rtl')}
            className={`p-2 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 ${
              editor.view.dom.dir === 'rtl' ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Right to Left"
          >
            <Languages size={18} />
            <span>RTL</span>
          </button>
        </div>

        {/* Text style controls */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
        </div>

        {/* Alignment controls */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Align Right"
          >
            <AlignRight size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Justify"
          >
            <AlignJustify size={18} />
          </button>
        </div>

        {/* Lists and Quote */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('blockquote') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Quote"
          >
            <Quote size={18} />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('paragraph') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
            title="Paragraph"
          >
            <Type size={18} />
          </button>
        </div>

        {/* Colors and Highlighting */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <div className="relative group">
            <button
              className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
              title="Text Color"
            >
              <Palette size={18} />
            </button>
            <div className="absolute hidden group-hover:flex flex-wrap gap-1 bg-white shadow-lg rounded-lg p-2 z-10">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div className="relative group">
            <button
              className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
              title="Highlight Color"
            >
              <Highlighter size={18} />
            </button>
            <div className="absolute hidden group-hover:flex flex-wrap gap-1 bg-white shadow-lg rounded-lg p-2 z-10">
              {highlightColors.map((color) => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
          title="Horizontal Rule"
        >
          <Minus size={18} />
        </button>

        {/* Clear formatting */}
        <button
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
          title="Clear Formatting"
        >
          <Eraser size={18} />
        </button>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-50"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-50"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().clearContent().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            title="Clear Content"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, height = '400px' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: 'Write your description here...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
        dir: 'auto',
        spellcheck: 'true',
        autocorrect: 'on',
        autocomplete: 'on',
      },
    },
  });

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ height }}>
      <div className="editor-toolbar">
        <MenuBar editor={editor} />
      </div>
      <div className="flex-1 overflow-y-auto editor-scroll">
        <div className="max-w-[794px] mx-auto bg-white min-h-full px-12 py-8">
          <EditorContent editor={editor} className="focus:outline-none" />
        </div>
      </div>
    </div>
  );
} 