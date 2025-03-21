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

      // Flag indicating this plugin has a settings panel
      withSettingPanel = true;

      /**
       * Renders the settings panel UI
       * @returns {HTMLElement} Container element with rendered settings component
       */
      // renderSettingPanel = () => {
      //   const container = document.createElement('div');
      //   render(<Setting />, container);
      //   return container;
      // }

      /**
       * Initializes the plugin
       * Sets up toolbar icons, right-click menus, and AI write prompts
       */
      async init() {
        // Initialize internationalization
        this.initI18n();
        
        // Add toolbar icon with click handler
        window.Blinko.addToolBarIcon({
          name: "clean-tag-tool",
          icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-file'><path d='M13 3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z'/><polyline points='14 3 14 9 19 9'/></svg>",
          placement: 'top',
          tooltip: '清除标签',
          content: () => {
            const container = document.createElement('div');
            container.setAttribute('data-plugin', 'my-note-plugin');
            render(<App />, container);
            return container;
          }
        });

        // Add right-click menu for clearing tags
        window.Blinko.addRightClickMenu({
          name: 'clear-tags',
          label: '清除标签',
          icon: 'tabler:tags-off',
          onClick: async (item) => {
            try {
              // 获取当前笔记内容
              const notes = await window.Blinko.api.notes.listByIds.mutate({
                ids: [item.id]
              });
              
              // 检查返回的数据结构
              console.log("notes:", notes);
              
              // 确保我们能获取到笔记内容
              if (!notes || !notes[0] || !notes[0].content) {
                throw new Error('无法获取笔记内容');
              }

              const content = this.removeHashtags(notes[0].content);
              
              // 更新笔记，清除所有标签
              await window.Blinko.api.notes.upsert.mutate({
                id: item.id,
                tags: [],
                content: content
              });
               // 刷新 note.list 不需要整个页面刷新 
               await window.Blinko.globalRefresh();

              // 显示成功提示
              window.Blinko.toast.success('标签已清除');
            } catch (error) {
              console.error('清除标签失败:', error);
              window.Blinko.toast.error('清除标签失败');
            }
          }
        });

        // Add AI write prompt for translation
        // window.Blinko.addAiWritePrompt(
        //   'Translate Content',
        //   'Please translate the following content into English:',
        //   'material-symbols:translate'
        // );

        // window.Blinko.showDialog({
        //   title: 'Dialog',
        //   content: () => {
        //     const container = document.createElement('div');
        //     container.setAttribute('data-plugin', 'my-note-plugin');
        //     render(<App />, container);
        //     return container;
        //   }
        // })
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