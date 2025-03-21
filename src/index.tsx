/** @jsxImportSource preact */
/// <reference types="systemjs" />

import { render } from 'preact/compat';
import { App } from "./app"
import type { BasePlugin } from 'blinko';
import { Setting } from './setting';
import plugin from '../plugin.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

/**
 * Main plugin entry point registered with SystemJS
 * Exports the plugin class implementing BasePlugin interface
 */
System.register([], (exports) => ({
  execute: () => {
    exports('default', class Plugin implements BasePlugin {
      constructor() {
        // Initialize plugin with metadata from plugin.json
        Object.assign(this, plugin);
      }

      /**
       * Initializes the plugin
       * Sets up toolbar icons, right-click menus, and AI write prompts
       */
      async init() {
        // Initialize internationalization
        this.initI18n();
      
        // Add right-click menu for clearing tags
        window.Blinko.addRightClickMenu({
          name: 'clear-tags',
          label: window.Blinko.i18n.t('title'),
          icon: 'tabler:tags-off',
          onClick: async (item) => {
            try {
              const notes = await window.Blinko.api.notes.listByIds.mutate({
                ids: [item.id]
              });
              
              console.log("notes:", notes);
              
              if (!notes || !notes[0] || !notes[0].content) {
                throw new Error(window.Blinko.i18n.t('clearTagsError'));
              }

              const content = this.removeHashtags(notes[0].content);
              
              await window.Blinko.api.notes.upsert.mutate({
                id: item.id,
                tags: [],
                content: content
              });
              await window.Blinko.globalRefresh();

              window.Blinko.toast.success(window.Blinko.i18n.t('clearTagsSuccess'));
            } catch (error) {
              console.error('清除标签失败:', error);
              window.Blinko.toast.error(window.Blinko.i18n.t('clearTagsError'));
            }
          }
        });
      }

      removeHashtags(content: string): string {
        // 先保护代码块内容，避免误删代码块中的 #
        const codeBlocks: string[] = [];
        const contentWithoutCode = content.replace(/```[\s\S]*?```/g, (match) => {
          codeBlocks.push(match);
          return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
        });
      
        // 使用与 extractHashtags 相同的正则表达式匹配标签
        const hashtagRegex = /(?<!:\/\/)(?<=\s|^)#[^\s#]+(?=\s|$)/g;
        
        // 移除标签
        let cleanContent = contentWithoutCode.replace(hashtagRegex, '');
        
        // 恢复代码块
        codeBlocks.forEach((block, index) => {
          cleanContent = cleanContent.replace(`__CODE_BLOCK_${index}__`, block);
        });
      
        return cleanContent;
      }

      /**
       * Initializes internationalization resources
       * Adds English and Chinese translation bundles
       */
      initI18n() {
        window.Blinko.i18n.addResourceBundle('en', 'translation', en);
        window.Blinko.i18n.addResourceBundle('zh', 'translation', zh);
      }

      /**
       * Cleanup function called when plugin is disabled
       */
      destroy() {
        console.log('Plugin destroyed');
      }
    });
  }
}));