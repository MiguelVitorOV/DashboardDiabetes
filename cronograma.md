# Cronograma de Evolução do Dashboard (20 Dias)

Este cronograma foi montado para transformar o projeto de um MVP baseado em arquivos CSV para uma solução mais completa e escalável (consumindo APIs e gerando relatórios), preparando-o para o Muriaé Tech Connect.

## Fase 1: Transição de Dados e API (Dias 1 a 5)
*Objetivo: Ajustar o ETL para extrair dados mais ricos do estado inteiro, sem focar em um município específico.*

- [x] **Dia 1-2:** Analisar os arquivos CSV (ex: `dados_cronicas_SES_2010.csv`) para mapear novas colunas úteis (Idade, Sexo, Cor/Raça, Escolaridade e Município).
- [x] **Dia 3:** Atualizar `etl_extract_diabetes.py` para remover os filtros exclusivos de Matipó.
- [x] **Dia 4:** Ajustar a extração para agrupar os óbitos pelas variáveis demográficas (faixa etária, gênero e raça).
- [x] **Dia 5:** Validar se os novos arquivos gerados em `data/extracted/` contêm os dados agregados corretamente para o estado.

## Fase 2: Transformação de Dados e Preparação para Relatórios (Dias 6 a 10)
*Objetivo: Criar métricas que contem uma história e permitam gerar relatórios.*

- [x] **Dia 6:** Ajustar o `etl_transform_diabetes.py` para calcular o "Top 10 Cidades com mais óbitos" e "Taxa de variação ano a ano".
- [x] **Dia 7:** Estruturar um novo formato de saída JSON contendo resumos que facilitem a plotagem de gráficos de pizza/barras.
- [x] **Dia 8-9:** Desenvolver uma etapa no script (ou função extra) para gerar um texto de "Resumo Analítico" *(Sendo delegado ao Front-end de forma dinâmica)*.
- [x] **Dia 10:** Revisar e testar todo o pipeline de ETL com os CSVs de todos os anos disponíveis.

## Fase 3: Reformulação Visual do Dashboard (Dias 11 a 15)
*Objetivo: Deixar o dashboard focado no panorama de Minas Gerais e com visual "Premium".*

- [ ] **Dia 11:** Adicionar "Cards de Resumo" no topo do dashboard (ex: Total de Óbitos MG, Principais Faixas Etárias, Ano com maior índice).
- [ ] **Dia 12:** Refatorar os gráficos atuais. Incluir gráficos de distribuição por Gênero e Escolaridade.
- [ ] **Dia 13:** Incluir um gráfico de barras destacando as 10 cidades com maiores números absolutos (substituindo a antiga comparação com Matipó).
- [ ] **Dia 14:** Adicionar filtros globais no topo (ex: "Filtrar por Ano" ou "Filtrar por Tipo de Diabetes/CID").
- [ ] **Dia 15:** Melhorar o design (cores, contrastes, tooltips) para ficar mais atrativo na apresentação do evento.

## Fase 4: Exportação de Relatórios e Pitch (Dias 16 a 20)
*Objetivo: Entregar a nova funcionalidade de relatórios e preparar a apresentação.*

- [ ] **Dia 16-17:** Implementar a funcionalidade de "Gerar Relatório". Pode ser um estilo de impressão da página configurado via CSS (`@media print`) ou exportação PDF via biblioteca.
- [ ] **Dia 18:** Escrever um roteiro claro de como a nova visualização atende estudantes e pesquisadores do estado inteiro.
- [ ] **Dia 19:** Fazer o deploy do projeto em um serviço gratuito (Vercel, Render, GitHub Pages) ou garantir que rode perfeitamente offline.
- [ ] **Dia 20:** Treinar a apresentação (pitch) exibindo os dados de MG, mostrando como o sistema extrai inteligência de arquivos CSV complexos e transforma em relatórios fáceis de ler.
