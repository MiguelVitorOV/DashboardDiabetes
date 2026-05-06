import pandas as pd
import json
import os
import glob

def load_dashboard():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    mg_dir = os.path.join(base_dir, 'data/processed/mg')
    matipo_dir = os.path.join(base_dir, 'data/processed/matipo')
    
    # Destinos
    output_etl = os.path.join(base_dir, 'data/diabetes_dashboard.json')
    output_frontend = os.path.join(base_dir, '../dashboard/data/diabetes_dashboard.json')
    
    dashboard_data = {"Ano": {}}
    
    # Listar anos disponíveis (baseado nos arquivos de MG)
    mg_files = glob.glob(os.path.join(mg_dir, 'dados_diabetes_processados_MG_*.csv'))
    
    for mg_file in mg_files:
        year = os.path.basename(mg_file).split('_')[-1].replace('.csv', '')
        
        # Ler MG
        df_mg = pd.read_csv(mg_file, sep=';')
        
        # Ler Matipó correspondente
        matipo_file = os.path.join(matipo_dir, f'dados_diabetes_processados_Matipo_{year}.csv')
        if os.path.exists(matipo_file):
            df_matipo = pd.read_csv(matipo_file, sep=';')
        else:
            df_matipo = None

        year_entry = {}
        
        # Colunas para processar (todas menos o que for metadado se houver)
        columns = df_mg.columns.tolist()
        
        for col in columns:
            year_entry[col] = {
                "MG": {
                    "Valor": int(df_mg.loc[0, col]),
                    "Porcentagem": str(df_mg.loc[1, col])
                }
            }
            
            if df_matipo is not None:
                year_entry[col]["Matipó"] = {
                    "Valor": int(df_matipo.loc[0, col]),
                    "Porcentagem": str(df_matipo.loc[1, col])
                }
            else:
                year_entry[col]["Matipó"] = {
                    "Valor": 0,
                    "Porcentagem": "0.0%"
                }
                
        dashboard_data["Ano"][year] = year_entry

    # Salvar no diretório ETL
    with open(output_etl, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=4, ensure_ascii=False)
    print(f"JSON gerado em {output_etl}")

    # Salvar no diretório do Dashboard (Frontend)
    os.makedirs(os.path.dirname(output_frontend), exist_ok=True)
    with open(output_frontend, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=4, ensure_ascii=False)
    print(f"JSON copiado para {output_frontend}")

if __name__ == "__main__":
    load_dashboard()
