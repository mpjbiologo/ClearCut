# ClearCut

**Editor gratuito de imagens com remoção de fundo por IA, executada localmente no navegador.**

ClearCut será uma aplicação web estática, hospedada no GitHub Pages. O objetivo é oferecer uma alternativa gratuita e privada para remover fundos, editar imagens e exportar resultados sem contas, assinaturas, APIs pagas ou processamento em servidores.

## Princípios do projeto

- Processamento de imagens no próprio dispositivo.
- Nenhum upload automático de imagens.
- Nenhuma API paga ou chave secreta no frontend.
- Armazenamento local sob controle do usuário.
- Sem cadastro obrigatório, marca-d'água ou limite artificial de imagens.
- Interface responsiva para computadores, tablets e celulares.
- Código aberto, com licenças de dependências e modelos verificadas.

## Estado atual

**Fase atual — fundação publicada e protótipo ISNet int8 em validação isolada.**

Já estão sendo preparados:
- Interface responsiva em português.
- Seleção de arquivos, arrastar e soltar e pré-visualização.
- Exportação local de imagem.
- Estrutura PWA e cache do shell da aplicação.
- Laboratório experimental ISNet int8 para comparar WASM e WebGPU.\n- Coleta de tempo de download, criação da sessão, inferência e estimativa de memória.\n- Checklist de avaliação visual e protocolo documentado antes da integração definitiva.

**Atenção:** a remoção automática por IA ainda não está habilitada no editor principal. O laboratório ISNet é experimental e não representa aprovação do modelo. A integração depende de validação de qualidade, desempenho, memória, CORS, integridade e funcionamento nos navegadores-alvo. A interface principal não simulará uma remoção que ainda não ocorreu.

## Tecnologias planejadas

- HTML, CSS e JavaScript nativos.
- Canvas API para edição e exportação.
- IndexedDB para projetos e preferências locais.
- ONNX Runtime Web para inferência local, após validação do modelo.
- WebGPU quando disponível, com fallback WASM.
- Service Worker para recursos offline.

## Desenvolvimento

O projeto será desenvolvido em etapas documentadas no histórico de mudanças. Consulte o arquivo CHANGELOG.md para acompanhar as entregas.

## Privacidade

As imagens selecionadas são processadas na memória do navegador nesta versão. O ClearCut não envia imagens para um servidor. O cache local da aplicação não substitui um backup: limpar os dados do navegador pode apagar projetos e arquivos locais.

## Licenças

Antes de adicionar bibliotecas, pesos de modelos ou outros recursos de terceiros, suas licenças e condições de redistribuição deverão ser verificadas e documentadas.
