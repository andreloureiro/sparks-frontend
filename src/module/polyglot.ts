import { Module, VNode, VNodeData } from '@motorcycle/dom';

import Polyglot = require('node-polyglot');

const userLanguage = navigator.language || (navigator as any).userLanguage || 'en-US';

export interface PolyglotVNodeData extends VNodeData {
  polyglot: any;
}

export interface PolyglotVNode extends VNode {
  data: PolyglotVNodeData;
}

export function makePolyglotModule (translations: any): Module {
  const polyglot = new Polyglot();
  polyglot.extend(translations[userLanguage]);

  function internationlizeTextContent(_, vNode: PolyglotVNode) {
    const { phrase = null } = vNode.data && vNode.data.polyglot || {};
    if (!phrase) { return; }
    if (vNode.elm) {
      vNode.elm.textContent = polyglot.t(phrase, vNode.data.polyglot);
    }
  }

  return {
    create: internationlizeTextContent,
    update: internationlizeTextContent
  } as Module;
}