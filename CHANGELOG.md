# Histórico de mudanças

Todas as alterações relevantes do projeto serão registradas aqui.

## 2026-11-18 — Pesquisa e seleção preliminar do motor de IA

- Documentada a avaliação de BiRefNet Lite Web (MIT) como candidato principal para protótipo ONNX Runtime Web.
- Registrada estratégia WebGPU com fallback WASM, execução em Worker, validação SHA-256 e cache local.
- Documentadas limitações conhecidas e alternativa ISNet int8 (Apache-2.0).
- Nenhum motor foi ativado ainda: a integração depende de testes reais de compatibilidade, desempenho, memória e qualidade.

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


## 2026-11-27 — Correção do runtime WASM no laboratório ISNet

- Configurados os caminhos explícitos dos artefatos `.mjs` e `.wasm` do ONNX Runtime Web 1.22.0 via jsDelivr, mantendo a mesma versão do runtime.
- Limitado o WASM a um thread para evitar dependência de `SharedArrayBuffer` no GitHub Pages.
- O Worker é reiniciado após falha de backend, evitando reutilizar uma instância do ONNX Runtime cujo WASM tenha falhado na inicialização.
- Atualizada a versão do cache do service worker para disponibilizar os arquivos corrigidos.
- WebGPU continua opcional; quando indisponível, o teste WASM permanece como alternativa.
