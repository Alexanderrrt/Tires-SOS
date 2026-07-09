import { DEFAULT_CHAT_SETTINGS } from "./chat-settings.default";

const str = (value, fallback = "", max = 2000) => {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
};

const bilingual = (value, fallback) => ({
  en: str(value?.en, fallback.en, 700),
  es: str(value?.es, fallback.es, 700),
});

export function sanitizeChatSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const promptSource = Array.isArray(source.quickPrompts) ? source.quickPrompts : [];
  const quickPrompts = promptSource
    .slice(0, 6)
    .map((prompt, index) => bilingual(prompt, DEFAULT_CHAT_SETTINGS.quickPrompts[index] || { en: "", es: "" }))
    .filter((prompt) => prompt.en.trim() || prompt.es.trim());

  return {
    title: bilingual(source.title, DEFAULT_CHAT_SETTINGS.title),
    subtitle: bilingual(source.subtitle, DEFAULT_CHAT_SETTINGS.subtitle),
    intro: bilingual(source.intro, DEFAULT_CHAT_SETTINGS.intro),
    placeholder: bilingual(source.placeholder, DEFAULT_CHAT_SETTINGS.placeholder),
    quickPrompts: quickPrompts.length ? quickPrompts : DEFAULT_CHAT_SETTINGS.quickPrompts,
    systemInstructions: str(
      source.systemInstructions,
      DEFAULT_CHAT_SETTINGS.systemInstructions,
      2000
    ),
  };
}

export function publicChatSettings(settings) {
  const clean = sanitizeChatSettings(settings);
  return {
    title: clean.title,
    subtitle: clean.subtitle,
    intro: clean.intro,
    placeholder: clean.placeholder,
    quickPrompts: clean.quickPrompts,
  };
}
