import { $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getSelection } from "lexical";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data";
import { SelectItem } from "@/components/ui/select";

const BLOCK_FORMAT_VALUE = "quote";

export function FormatQuote() {
  const { activeEditor, blockType } = useToolbarContext();

  const formatQuote = () => {
    if (blockType !== "quote") {
      activeEditor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createQuoteNode());
      });
    }
  };

  const block = blockTypeToBlockName[BLOCK_FORMAT_VALUE];
  if (!block) return null;

  return (
    <SelectItem onPointerDown={formatQuote} value="quote">
      <div className="flex items-center gap-1 font-normal">
        {block.icon}
        {block.label}
      </div>
    </SelectItem>
  );
}
