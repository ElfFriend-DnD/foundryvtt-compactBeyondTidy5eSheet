// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { log } from './helpers';
import { preloadTemplates } from './module/preloadTemplates.js';
import { MODULE_ID, MySettings } from './constants.js';
import ActorSheet5eCharacter from '../../systems/dnd5e/module/actor/sheets/character.js';

Handlebars.registerHelper('cb5es-path', (relativePath: string) => {
  return `modules/${MODULE_ID}/${relativePath}`;
});

Handlebars.registerHelper('cb5es-safeVal', (value, fallback) => {
  return new Handlebars.SafeString(value || fallback);
});

Handlebars.registerHelper('cb5es-add', (value: number, toAdd: number) => {
  return new Handlebars.SafeString(String(value + toAdd));
});

Handlebars.registerHelper('cb5es-isEmpty', (input: Object | Array<any> | Set<any>) => {
  if (!input) {
    return true;
  }
  if (input instanceof Array) {
    return input.length < 1;
  }
  if (input instanceof Set) {
    return input.size < 1;
  }
  return isObjectEmpty(input);
});

export class CompactBeyond5eSheet extends ActorSheet5eCharacter {
  get template() {
    if (!game.user.isGM && this.actor.limited && !game.settings.get(MODULE_ID, MySettings.expandedLimited)) {
      return `modules/${MODULE_ID}/templates/character-sheet-ltd.hbs`;
    }

    return `modules/${MODULE_ID}/templates/character-sheet.hbs`;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;

    mergeObject(options, {
      classes: ['dnd5e', 'sheet', 'actor', 'character', 'cb5es'],
      scrollY: [...options.scrollY, '.sheet-sidebar'],
      height: 680,
    } as BaseEntitySheet.Options);

    return options;
  }

  async _renderInner(...args: Parameters<ActorSheet5eCharacter['_renderInner']>) {
    const html = await super._renderInner(...args);
    const actionsListApi = game.modules.get('character-actions-list-5e')?.api;

    try {
      const actionsTab = html.find('.actions');

      const actionsTabHtml = (await actionsListApi?.renderActionsList(this.actor)) as string;
      actionsTab.html(actionsTabHtml);
    } catch (e) {
      log(true, e);
    }

    return html;
  }

  getData() {
    const sheetData = super.getData();

    try {
      //@ts-ignore
      sheetData.settings = {
        //@ts-ignore
        ...sheetData.settings,
        [MODULE_ID]: {
          passiveDisplay: {
            prc: game.settings.get(MODULE_ID, MySettings.displayPassivePerception),
            ins: game.settings.get(MODULE_ID, MySettings.displayPassiveInsight),
            inv: game.settings.get(MODULE_ID, MySettings.displayPassiveInvestigation),
            ste: game.settings.get(MODULE_ID, MySettings.displayPassiveStealth),
          },
        },
      };
    } catch (e) {
      log(true, 'error trying to populate sheet settings', e);
    }

    return sheetData;
  }
}

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
  log(true, `Initializing ${MODULE_ID}`);

  // Assign custom classes and constants here

  // Register custom module settings
  registerSettings();

  // Preload Handlebars templates
  await preloadTemplates();
});

// Register compactBeyond5eSheet Sheet
Actors.registerSheet('dnd5e', CompactBeyond5eSheet, {
  label: 'Compact D&D Beyond-like',
  makeDefault: false,
  types: ['character'],
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});
