import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data";
import { SelectItem } from "@/components/ui/select";

const BLOCK_FORMAT_VALUE = "paragraph";

export function FormatParagraph() {
  const { activeEditor } = useToolbarContext();

  const formatParagraph = () => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const block = blockTypeToBlockName[BLOCK_FORMAT_VALUE];
  if (!block) return null;

  return (
    <SelectItem onPointerDown={formatParagraph} value={BLOCK_FORMAT_VALUE}>
      <div className="flex items-center gap-1 font-normal">
        {block.icon}
        {block.label}
      </div>
    </SelectItem>
  );
}
