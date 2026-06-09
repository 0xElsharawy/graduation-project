/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity";
import type { TextNode } from "lexical";
import { JSX, useCallback, useEffect } from "react";

import {
  $createKeywordNode,
  KeywordNode,
} from "@/components/editor/nodes/keyword-node";

// Word-boundary character class — matches any non-letter character (or start/end of string)
// All previously-broken ranges are now expressed as explicit \uXXXX escapes to avoid
// encoding issues when the file is saved or transferred.
const WORD_BOUNDARY =
  String.raw`(?:^|$|[^A-Za-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐ` +
  // Devanagari nukta forms (क etc.) - use explicit escapes
  String.raw`\u0958-\u0961\u0971-\u0977\u0979-\u097F` +
  String.raw`অ-ঌএঐও-নপ-রলশ-হঽৎ` +
  // Bengali nukta forms
  String.raw`\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1` +
  String.raw`ਅ-ਊਏਐਓ-ਨਪ-ਰ` +
  // Gurmukhi nukta forms
  String.raw`\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74` +
  String.raw`અ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡ` +
  String.raw`ଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽ` +
  // Odia nukta forms
  String.raw`\u0B5C\u0B5D\u0B5F-\u0B61\u0B71` +
  String.raw`ஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐ` +
  String.raw`అ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡ` +
  String.raw`ಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲ` +
  String.raw`അ-ഌഎ-ഐഒ-ഺഽ` +
  // Malayalam - ൎ0D4E) and ൿ (\u0D7F) are isolated, not a range
  String.raw`\u0D4E\u0D7F` +
  String.raw`අ-ඖක-නඳ-රලව-ෆ` +
  String.raw`ก-ะาเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-iℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣\uD800-\uDBFF豈-舘並-龎ﬀ-ﬆﬓ-ﬗ` +
  // Hebrew presentation forms - use escapes to avoid encoding issues
  String.raw`\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1` +
  String.raw`\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB` +
  String.raw`\uFE70-\uFE74\uFE76-\uFEFC` +
  String.raw`Ａ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ])`;

const KEYWORDS =
  "congrats|congratulations|gratuluju|gratuluji|gratulujeme|blahopřeju|blahopřeji|blahopřejeme|Til lykke|Tillykke|Glückwunsch|Gratuliere|felicitaciones|enhorabuena|paljon onnea|onnittelut|Félicitations|gratula|gratulálok|gratulálunk|congratulazioni|complimenti|おめでとう|おめでとうございます|축하해|축하해요|gratulerer|Gefeliciteerd|gratulacje|Parabéns|parabéns|felicitações|felicitări|мои поздравления|поздравляем|поздравляю|gratulujem|blahoželám|ยนดดวย|ขอแสดงความยนด|tebrikler|tebrik ederim|恭喜|祝贺你|恭喜你|恭喜|恭喜|baie geluk|veels geluk|অভননন|Čestitam|Čestitke|Čestitamo|Συγχαρητήρια|Μπράβο|અભનદન|badhai|बधई|अभनदन|Честитам|Свака част|hongera|வழததகள|வழததககள|అభనదనల|അഭനനനങൾ|Chúc mừng|מזל טוב|mazel tov|mazal tov";

const KEYWORDS_REGEX = new RegExp(
  `(${WORD_BOUNDARY})(${KEYWORDS})(${WORD_BOUNDARY})`,
  "i"
);

export function KeywordsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([KeywordNode])) {
      throw new Error("KeywordsPlugin: KeywordNode not registered on editor");
    }
  }, [editor]);

  const $createKeywordNode_ = useCallback(
    (textNode: TextNode): KeywordNode =>
      $createKeywordNode(textNode.getTextContent()),
    []
  );

  const getKeywordMatch = useCallback((text: string) => {
    const matchArr = KEYWORDS_REGEX.exec(text);

    if (matchArr === null) {
      return null;
    }

    const [, boundary, keyword] = matchArr;

    if (boundary === undefined || keyword === undefined) {
      return null;
    }

    const startOffset = matchArr.index + boundary.length;
    const endOffset = startOffset + keyword.length;

    return {
      end: endOffset,
      start: startOffset,
    };
  }, []);

  useLexicalTextEntity<KeywordNode>(
    getKeywordMatch,
    KeywordNode,
    $createKeywordNode_
  );

  return null;
}
