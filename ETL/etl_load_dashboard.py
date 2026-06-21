import pandas as pd
import json
import os
import glob

def load_dashboard():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(base_dir, 'data/processed')
    output_etl = os.path.join(base_dir, 'data/diabetes_dashboard.json')
    output_frontend = os.path.join(base_dir, '../dashboard/data/diabetes_dashboard.json')
    
    dashboard_data = {"Ano": {}}
    
    files = glob.glob(os.path.join(input_dir, 'agregados_ano_*.csv'))
    
    for file_path in files:
        year = os.path.basename(file_path).split('_')[-1].replace('.csv', '')
        print(f"Processando JSON para o ano {year}...")
        df = pd.read_csv(file_path, sep=';', encoding='utf-8')
        # Estrutura: Ano -> Municipio -> CID -> Categoria -> {Valor, Porcentagem}
        year_entry = {}
        
        # Iterar sobre cada município no dataframe
        for mun in df['Municipio'].unique():
            mun_data = {}
            df_mun = df[df['Municipio'] == mun]
            
            for _, row in df_mun.iterrows():
                cid = row['CID_Grupo']
                cid_data = {}
                
                total_obitos = int(row['Obitos'])
                
                # Para cada métrica
                for col in df.columns:
                    if col not in ['Municipio', 'CID_Grupo']:
                        valor = int(row[col])
                        # Apenas remover 0 conforme pedido
                        if valor == 0:
                            continue
                            
                        pct = f"{(valor / total_obitos * 100):.1f}%" if total_obitos > 0 else "0.0%"
                        cid_data[col] = {
                            "Valor": valor,
                            "Porcentagem": pct
                        }
                
                mun_data[cid] = cid_data
            
            year_entry[mun] = mun_data
        dashboard_data["Ano"][year] = year_entry
        
    # Calcular Taxa de Variação Ano a Ano e Top 10
    sorted_years = sorted(dashboard_data["Ano"].keys())
    
    dashboard_data["Analytics"] = {"Ano": {}}
    
    for i, year in enumerate(sorted_years):
        dashboard_data["Analytics"]["Ano"][year] = {}
        
        # 1. Top 10 Municípios
        year_muns = dashboard_data["Ano"][year]
        # Pegar apenas municípios (ignorar 'MG' e 'IGNORADO')
        mun_obitos = []
        for mun_name, mun_data in year_muns.items():
            if mun_name not in ['MG', 'IGNORADO'] and 'Total' in mun_data:
                mun_obitos.append({
                    "Municipio": mun_name,
                    "Obitos": mun_data['Total'].get('Obitos', {}).get('Valor', 0)
                })
        
        # Ordenar e pegar top 10
        top_10 = sorted(mun_obitos, key=lambda x: x['Obitos'], reverse=True)[:10]
        dashboard_data["Analytics"]["Ano"][year]["Top10_Municipios"] = top_10
        
        # 2. Variação Ano a Ano para todas as cidades
        if i > 0:
            prev_year = sorted_years[i - 1]
            for mun_name, mun_data in year_muns.items():
                if 'Total' in mun_data:
                    current_obitos = mun_data['Total'].get('Obitos', {}).get('Valor', 0)
                    
                    prev_obitos = 0
                    if mun_name in dashboard_data["Ano"][prev_year]:
                        if 'Total' in dashboard_data["Ano"][prev_year][mun_name]:
                            prev_obitos = dashboard_data["Ano"][prev_year][mun_name]['Total'].get('Obitos', {}).get('Valor', 0)
                            
                    var_abs = current_obitos - prev_obitos
                    if prev_obitos > 0:
                        var_pct = (var_abs / prev_obitos) * 100
                        var_pct_str = f"{'+' if var_pct > 0 else ''}{var_pct:.1f}%"
                    elif current_obitos > 0:
                        var_pct_str = "+100.0%"
                    else:
                        var_pct_str = "0.0%"
                        
                    dashboard_data["Ano"][year][mun_name]['Total']['Variacao_Ano_Anterior'] = {
                        "Absoluta": var_abs,
                        "Porcentagem": var_pct_str
                    }

    # Salvar
    with open(output_etl, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, separators=(',', ':'), ensure_ascii=False)
    print(f"JSON gerado em {output_etl}")

    os.makedirs(os.path.dirname(output_frontend), exist_ok=True)
    with open(output_frontend, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, separators=(',', ':'), ensure_ascii=False)
    print(f"JSON copiado para {output_frontend}")

if __name__ == "__main__":
    load_dashboard()
