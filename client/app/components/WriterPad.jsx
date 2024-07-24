import React, { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { toggleMark, setBlockType, wrapInList } from "prosemirror-commands";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import "prosemirror-view/style/prosemirror.css"; // Import ProseMirror's CSS

// Create a new schema by adding list nodes to the basic schema
const mySchema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
  marks: basicSchema.spec.marks,
});

const ProseMirrorEditor = () => {
  const editorRef = useRef();

  useEffect(() => {
    // Initialize the editor state
    const state = EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(document.createElement("div")),
      schema: mySchema,
    });

    // Create the EditorView
    const view = new EditorView(editorRef.current, {
      state,
    });

    // Store the view in the ref to access it later
    editorRef.current.view = view;

    // Cleanup function to destroy the view
    return () => {
      view.destroy();
    };
  }, []);

  // Function to apply a mark
  const applyMark = (mark) => {
    return (state, dispatch) => {
      toggleMark(mySchema.marks[mark])(state, dispatch);
    };
  };

  // Function to apply block type
  const applyBlockType = (type, attrs = {}) => {
    return (state, dispatch) => {
      setBlockType(mySchema.nodes[type], attrs)(state, dispatch);
    };
  };

  // Function to wrap in list
  const wrapList = (type) => {
    return (state, dispatch) => {
      wrapInList(mySchema.nodes[type])(state, dispatch);
    };
  };

  // Handler for bold button click
  const onBoldClick = () => {
    const view = editorRef.current.view;
    applyMark("strong")(view.state, view.dispatch);
    view.focus();
  };

  // Handler for italic button click
  const onItalicClick = () => {
    const view = editorRef.current.view;
    applyMark("em")(view.state, view.dispatch);
    view.focus();
  };

  // Handler for heading button click
  const onHeadingClick = (level) => {
    const view = editorRef.current.view;
    applyBlockType("heading", { level })(view.state, view.dispatch);
    view.focus();
  };

  // Handler for bullet list button click
  const onBulletListClick = () => {
    const view = editorRef.current.view;
    wrapList("bullet_list")(view.state, view.dispatch);
    view.focus();
  };

  // Handler for ordered list button click
  const onOrderedListClick = () => {
    const view = editorRef.current.view;
    wrapList("ordered_list")(view.state, view.dispatch);
    view.focus();
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="bg-gray-100 p-4 rounded-t-lg flex space-x-2">
        <button
          onClick={onBoldClick}
          className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        >
          Bold
        </button>
        <button
          onClick={onItalicClick}
          className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        >
          Italic
        </button>
        <button
          onClick={() => onHeadingClick(1)}
          className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        >
          H1
        </button>
        <button
          onClick={() => onHeadingClick(2)}
          className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        >
          H2
        </button>
        <button
          onClick={onBulletListClick}
          className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        >
          Bullet List
        </button>
        <button
          onClick={onOrderedListClick}
          className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        >
          Ordered List
        </button>
      </div>
      <div
        ref={editorRef}
        className="bg-white border border-gray-300 rounded-b-lg p-4 prose"
      />
    </div>
  );
};

export default ProseMirrorEditor;
