# Dashboard Mortalidade por Diabetes (MG)

Este projeto automatiza a coleta, processamento e visualização de dados de mortalidade por Diabetes (CID-10 E10-E14) em Minas Gerais, permitindo a comparação entre os dados estaduais (MG) e os dados específicos do município de Matipó.

## 🚀 Setup Inicial

Para rodar este projeto, você precisará preparar o ambiente e os dados:

### 1. Instalar Dependências
Certifique-se de ter o Python instalado e instale a biblioteca Pandas:
```bash
pip install pandas
```

### 2. Baixar os Arquivos CSV
Os dados brutos devem ser baixados e colocados na pasta `ETL/data/raw/`.

- **Anos 2010 a 2023**: [Download aqui](https://github.com/thiagomrm/Doencas_Cronicas)
- **Anos 2024 a 2026**: [Download aqui (SES-MG)](https://dados.mg.gov.br/dataset/doencas_croninas)

*Certifique-se de que os arquivos sigam o padrão de nome: `dados_cronicas_SES_YYYY.csv`*

---

## ⚙️ Execução do Pipeline (ETL)

A atualização dos dados segue uma ordem obrigatória de scripts dentro da pasta `ETL/`:

1.  **Extração**: `python etl_extract_diabetes.py`
    - Filtra os óbitos por CID-10 (E10-E14) e gera arquivos em `data/extracted/`.
2.  **Transformação**: `python etl_transform_diabetes.py`
    - Calcula totais e porcentagens demográficas para o estado (MG) e para o município (Matipó) simultaneamente.
3.  **Carga**: `python etl_load_dashboard.py`
    - Consolida tudo em um JSON e o envia para a pasta do dashboard.

---

## 📊 Visualização

Após rodar o ETL, o dashboard estará pronto para exibição.

### Estrutura de Pastas
```text
.
├── dashboard/              # Frontend (HTML, CSS, JS)
│   ├── data/              # Onde o JSON final é armazenado
│   └── index.html         # Arquivo principal para abrir no navegador
└── ETL/                   # Backend (Scripts Python e Dados)
```

### Como abrir o dashboard
Como o dashboard realiza requisições para ler o arquivo JSON, ele precisa ser servido por um servidor local. Na raiz do projeto, execute:
```bash
python3 -m http.server 8000
```
E acesse: [http://localhost:8000/dashboard/index.html](http://localhost:8000/dashboard/index.html)
