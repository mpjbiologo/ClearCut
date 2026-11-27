# Pesquisa técnica — motor de remoção de fundo

Atualizado em 18/11/2026.

## Objetivo

Selecionar um modelo de segmentação executado integralmente no navegador, sem enviar imagens para um servidor de inferência, sem API paga e sem cadastro.

## Candidato inicialmente pesquisado: BiRefNet Lite para navegador

Repositório do modelo: https://huggingface.co/clevr-tools/birefnet-lite-web

- Licença declarada: MIT; o cartão do modelo informa que os pesos e arquivos desta exportação seguem a mesma licença. Preservar LICENSE e NOTICE e atribuir crédito ao trabalho original.
- Exportação ONNX preparada especificamente para ONNX Runtime Web.
- Variante WebGPU: entrada 768 × 768, aproximadamente 104,3 MB.
- Variante WASM: entrada 512 × 512, aproximadamente 101,1 MB.
- O modelo recebe tensor RGB normalizado com média [0.485, 0.456, 0.406] e desvio [0.229, 0.224, 0.225]; saída é um logit de matte, convertido em alfa por sigmoid.
- A documentação publica resultados de validação em 96 imagens: IoU refinado médio de 0,9651 para 768 e 0,9540 para 512. Isso não garante o mesmo resultado em todas as categorias ou dispositivos.
- Limitações relatadas: vidro/objetos translúcidos, fios de cabelo em fundos complexos e objetos com cor semelhante à do fundo.

A página do modelo também informa que o ONNX original exigiu adaptações específicas para funcionar no navegador. Portanto, não substituir por um export genérico do BiRefNet sem validar compatibilidade.

## Estratégia de execução proposta

1. Detectar suporte a WebGPU e tentar a variante 768.
2. Se WebGPU não estiver disponível ou a sessão falhar na inicialização, oferecer/usar a variante 512 em WASM.
3. Se a inferência falhar, manter a imagem original e exibir erro claro; nunca exportar uma falsa transparência.
4. Executar inferência em Web Worker para não bloquear a interface.
5. Exibir o tamanho do download, progresso, cancelamento quando tecnicamente possível e estado do cache.
6. Baixar o modelo sob demanda, fixado em revisão imutável, validar SHA-256 antes de usar e guardar em cache local após consentimento/ação explícita.
7. Processar somente pixels locais. A imagem do usuário nunca deve ser enviada ao provedor que hospeda os pesos.
8. Documentar que, na primeira instalação do modelo, o navegador solicita os arquivos de runtime/modelo aos respectivos CDNs; após cache válido, a inferência pode funcionar offline.

## Runtime

ONNX Runtime Web documenta o uso de onnxruntime-web/webgpu com executionProviders: ['webgpu']; WASM é a alternativa para navegadores sem WebGPU. Fixar versão do runtime e verificar compatibilidade real com os operadores usados pelo modelo antes de publicar.

Documentação oficial: https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html

## Alternativa de comparação

ISNet int8 para navegador: https://huggingface.co/chenjindu/isnet-web

- Licença declarada: Apache-2.0 para código e pesos.
- Aproximadamente 44 MB, entrada 1024 × 1024.
- Exportação ONNX dividida em três partes e indicada para WASM ou WebGPU.
- Deve ser avaliada como alternativa mais leve, mas requer reconstrução dos fragmentos e testes próprios.

## Decisão desta etapa

BiRefNet Lite Web é o candidato principal para um primeiro protótipo, não uma integração aprovada para produção ainda. Antes de habilitar o botão de remoção no editor principal, validar carregamento, CORS, integridade SHA-256, memória, tempo de inferência e resultado real em Chrome/Edge, Firefox e Safari. A qualidade precisa ser testada com pessoas, cabelo, animais, produtos, objetos translúcidos e fundos complexos.

## Referências

- Modelo BiRefNet Lite Web e licença: https://huggingface.co/clevr-tools/birefnet-lite-web
- ONNX Runtime Web — WebGPU: https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
- Modelo ISNet int8 e licença: https://huggingface.co/chenjindu/isnet-web
