# Histórico de mudanças

Todas as alterações relevantes do projeto serão registradas aqui.

## 2026-11-18 — Fundação inicial

- Criada a estrutura inicial do ClearCut.
- Adicionada interface responsiva em português.
- Implementados carregamento por seletor e arrastar/soltar.
- Adicionadas pré-visualização local e exportação PNG.
- Criados manifesto PWA e cache inicial do shell para acesso offline.
- Definidos os princípios de privacidade e processamento local.
- A remoção por IA permanece explicitamente pendente da validação do modelo e da licença.

## 2026-11-18 — Correção do workflow de publicação

- Atualizadas as actions do GitHub Pages para versões compatíveis com Node.js 24.
- Fixado o runner em Ubuntu 24.04 para evitar mudanças automáticas de imagem durante os builds.
- Mantida a configuração de permissões necessária para publicação pelo GitHub Actions.
- A primeira ativação do GitHub Pages ainda precisa ser feita nas configurações do repositório; o token padrão do workflow não tem permissão administrativa para criar o site.
