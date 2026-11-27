# Laboratório ISNet int8 — protocolo de validação

Status: protótipo experimental, não aprovado para integração definitiva.

## Modelo e dependências

- Modelo: [chenjindu/isnet-web](https://huggingface.co/chenjindu/isnet-web)
- Revisão fixada no protótipo: `cda7d26`
- Arquivos: `isnet-w8.part00`, `part01`, `part02`, reagrupados no navegador.
- Tamanho publicado: aproximadamente 44 MB.
- Licença declarada pelo repositório do modelo: Apache-2.0.
- Runtime: ONNX Runtime Web 1.22.0, carregado do jsDelivr.
- Entrada declarada pelo modelo: RGB 1024 × 1024; saída: matte alfa de um canal.
- Referência de implementação e licença: [browser-remove-background](https://github.com/chenjindu/browser-remove-background).

A revisão é fixada para evitar que a aplicação consuma silenciosamente arquivos alterados na branch principal do provedor. Antes de produção, registrar SHA-256 dos três fragmentos e validar os arquivos servidos por HTTPS/CORS.

## Como executar

1. Abra `isnet-lab.html` pelo GitHub Pages ou por servidor HTTP local.
2. Selecione uma imagem local.
3. Execute WASM e/ou WebGPU.
4. Repita cada provedor pelo menos três vezes, distinguindo download, criação de sessão/compilação e inferência aquecida.
5. Faça a avaliação visual dos critérios e repita em navegadores/dispositivos diferentes.
6. Exporte PNG apenas para inspecionar o resultado experimental.

## Métricas coletadas

- Bytes recebidos do modelo e tempo de download.
- Tempo de criação da sessão.
- Tempo de uma inferência.
- Heap JS, quando `performance.memory` está disponível.
- Estimativa de buffers conhecidos: modelo + tensor de entrada + tensor de saída + máscara.

A estimativa de buffers não é uma medição do pico total de RAM/VRAM. O navegador não expõe uma API portátil para isso. Anotar também travamentos, aba encerrada, falha de alocação, aquecimento e consumo observado pelo sistema operacional.

## Matriz de qualidade

Testar, no mínimo:
- Pessoa em fundo simples e complexo.
- Cabelo, barba, pelos e bordas finas.
- Animais.
- Produtos e objetos pequenos.
- Objetos com cor semelhante ao fundo.
- Vidro/transparências, quando aplicável.
- Imagens com proporções e resoluções variadas.

Avaliar contorno, objetos apagados, fundo residual, halos, suavidade e transparência. A checklist na página é manual e não constitui métrica objetiva de benchmark. Guardar amostras de entrada e resultados de referência localmente, com autorização do titular, sem upload.

## Limitações conhecidas desta prova de conceito

- O pré-processamento atual redimensiona a imagem para 1024 × 1024 sem preservar a proporção; isso pode distorcer objetos. É intencionalmente uma primeira bancada de compatibilidade, não o pipeline final.
- A máscara é normalizada pelo mínimo/máximo da saída, conforme o protótipo de referência. A semântica e calibração da saída devem ser validadas contra amostras antes de produção.
- O teste atual não faz cache persistente dos pesos, não funciona offline na primeira versão e não calcula SHA-256 em runtime.
- WebGPU pode não estar disponível em todos os navegadores/dispositivos; WASM é a rota de compatibilidade.
- Memória é aproximada e pode subestimar alocações internas do runtime/GPU.

## Portões antes de integrar

- [ ] CORS, estabilidade e revisão imutável dos arquivos verificados.
- [ ] Hash SHA-256 dos três fragmentos publicado e validado.
- [ ] Pré-processamento com preservação de proporção e tratamento de orientação EXIF.
- [ ] Pós-processamento validado com imagens de referência e métricas de máscara.
- [ ] Testes de desempenho WASM/WebGPU em Chrome, Edge e Firefox.
- [ ] Testes de memória em desktop e dispositivos móveis com pouca RAM.
- [ ] Cache local, download sob demanda, progresso, cancelamento e comportamento offline definidos.
- [ ] Execução em Worker sem bloquear a interface.
- [ ] Licença Apache-2.0 e avisos de atribuição incluídos na distribuição.
- [ ] Nenhuma imagem do usuário transmitida.
- [ ] Aprovação manual dos resultados e documentação dos limites.

Não habilitar a remoção de fundo no editor principal enquanto os portões acima não forem concluídos.
