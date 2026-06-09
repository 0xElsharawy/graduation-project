"use client";

import { $isTableSelection } from "@lexical/table";
import { $isRangeSelection, BaseSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { SubscriptIcon, SuperscriptIcon } from "lucide-react";
import { useState } from "react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function SubSuperToolbarPlugin() {
  const { activeEditor } = useToolbarContext();
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
    }
  };

  useUpdateToolbarHandler($updateToolbar);

  return (
    <ToggleGroup
      defaultValue={
        isSubscript ? "subscript" : isSuperscript ? "superscript" : ""
      }
      type="single"
    >
      <ToggleGroupItem
        aria-label="Toggle subscript"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
        }}
        size="sm"
        value="subscript"
        variant={"outline"}
      >
        <SubscriptIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label="Toggle superscript"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
        }}
        size="sm"
        value="superscript"
        variant={"outline"}
      >
        <SuperscriptIcon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
