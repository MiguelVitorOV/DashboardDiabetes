import pandas as pd
import os
import glob
import numpy as np

def calculate_summary(df):
    """Calcula os totais demográficos para um DataFrame fornecido."""
    if df.empty:
        return {col: 0 for col in [
            'Obitos', 'Masculino', 'Feminino', 
            'Branco', 'Pardo', 'Preto', 'Amarelo', 'Indigena', 
            'Jovens (0-29)', '<10', '10-14', '15-19', '20-24', '25-29', 
            '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', 
            '60-64', '65-69', '70-74', '75-79', '80-84', '85-89', '90-94', '95-99', '100+', 'Ignorado',
            'Sem Escolaridade', 'Fundamental I', 'Fundamental II',
            'Ensino Médio', 'Ensino Superior', 'Ignorada'
        ]}

    # Otimização usando vetorização do pandas
    s_sexo = df['sg_sexo'].astype(str).str.strip().str.upper()
    s_raca = df['tp_raca_cor'].astype(str).str.strip().str.upper()
    s_esc = df['tp_escolaridade'].astype(str).str.strip().str.upper()
    
    # Tratamento de idade
    nu_idade = pd.to_numeric(df['nu_idade'].astype(str).str.replace(',', '.').str.strip(), errors='coerce')

    summary = {
        'Obitos': len(df),
        'Masculino': (s_sexo.str.startswith('M')).sum(),
        'Feminino': (s_sexo.str.startswith('F')).sum(),
        'Branco': (s_raca.str.contains('BRANC')).sum(),
        'Pardo': (s_raca.str.contains('PARD')).sum(),
        'Preto': (s_raca.str.contains('PRET')).sum(),
        'Amarelo': (s_raca.str.contains('AMAREL')).sum(),
        'Indigena': (s_raca.str.contains('INDIG')).sum(),
        
        # Idades
        'Jovens (0-29)': ((nu_idade >= 0) & (nu_idade <= 29)).sum(),
        '<10': (nu_idade < 10).sum(),
        '10-14': ((nu_idade >= 10) & (nu_idade <= 14)).sum(),
        '15-19': ((nu_idade >= 15) & (nu_idade <= 19)).sum(),
        '20-24': ((nu_idade >= 20) & (nu_idade <= 24)).sum(),
        '25-29': ((nu_idade >= 25) & (nu_idade <= 29)).sum(),
        '30-34': ((nu_idade >= 30) & (nu_idade <= 34)).sum(),
        '35-39': ((nu_idade >= 35) & (nu_idade <= 39)).sum(),
        '40-44': ((nu_idade >= 40) & (nu_idade <= 44)).sum(),
        '45-49': ((nu_idade >= 45) & (nu_idade <= 49)).sum(),
        '50-54': ((nu_idade >= 50) & (nu_idade <= 54)).sum(),
        '55-59': ((nu_idade >= 55) & (nu_idade <= 59)).sum(),
        '60-64': ((nu_idade >= 60) & (nu_idade <= 64)).sum(),
        '65-69': ((nu_idade >= 65) & (nu_idade <= 69)).sum(),
        '70-74': ((nu_idade >= 70) & (nu_idade <= 74)).sum(),
        '75-79': ((nu_idade >= 75) & (nu_idade <= 79)).sum(),
        '80-84': ((nu_idade >= 80) & (nu_idade <= 84)).sum(),
        '85-89': ((nu_idade >= 85) & (nu_idade <= 89)).sum(),
        '90-94': ((nu_idade >= 90) & (nu_idade <= 94)).sum(),
        '95-99': ((nu_idade >= 95) & (nu_idade <= 99)).sum(),
        '100+': (nu_idade >= 100).sum(),
        'Ignorado': (nu_idade.isna()).sum(),
        
        # Escolaridade
        'Sem Escolaridade': (s_esc.str.contains('NENHUMA')).sum(),
        'Fundamental I': (s_esc.str.contains('1 A 3')).sum(),
        'Fundamental II': (s_esc.str.contains('4 A 7')).sum(),
        'Ensino Médio': (s_esc.str.contains('8 A 11')).sum(),
        'Ensino Superior': (s_esc.str.contains('12 ANOS E MAIS')).sum(),
        'Ignorada': (s_esc.str.contains('IGNORADO') | (s_esc.isna()) | (s_esc == '')).sum()
    }
    return summary

def transform_diabetes():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(base_dir, 'data/extracted')
    output_dir = os.path.join(base_dir, 'data/processed')
    
    os.makedirs(output_dir, exist_ok=True)
    
    files = glob.glob(os.path.join(input_dir, 'diabetes_*.csv'))
    
    for file_path in files:
        year = os.path.basename(file_path).split('_')[1].replace('.csv', '')
        print(f"Transformando dados de {year}...")
        
        df_full = pd.read_csv(file_path, sep=';', encoding='utf-8', low_memory=False)
        if df_full.empty:
            continue
            
        df_full.columns = df_full.columns.str.replace(r'^\ufeff', '', regex=True).str.strip()
        
        # Padronizar Município
        mun_col = 'co_municipio_ibge_residencia' if 'co_municipio_ibge_residencia' in df_full.columns else 'co_municipio_residencia'
        df_full['Municipio'] = df_full[mun_col].fillna('IGNORADO').astype(str).str.strip()
        
        # Extrair Prefixo do CID (E10, E11, E12, E13, E14)
        df_full['CID_Grupo'] = df_full['co_cid_causa_basica'].astype(str).str[:3].str.upper()
        
        all_records = []
        
        # 1. Processar Estado (MG)
        # 1.1 Total MG
        mg_total = calculate_summary(df_full)
        mg_total['Municipio'] = 'MG'
        mg_total['CID_Grupo'] = 'Total'
        all_records.append(mg_total)
        
        # 1.2 Por CID MG
        for cid, df_cid in df_full.groupby('CID_Grupo'):
            if cid in ['E10', 'E11', 'E12', 'E13', 'E14']:
                mg_cid = calculate_summary(df_cid)
                mg_cid['Municipio'] = 'MG'
                mg_cid['CID_Grupo'] = cid
                all_records.append(mg_cid)
                
        # 2. Processar por Município
        for mun, df_mun in df_full.groupby('Municipio'):
            # 2.1 Total do Município
            mun_total = calculate_summary(df_mun)
            mun_total['Municipio'] = mun
            mun_total['CID_Grupo'] = 'Total'
            all_records.append(mun_total)
            
            # 2.2 Por CID do Município
            for cid, df_mun_cid in df_mun.groupby('CID_Grupo'):
                if cid in ['E10', 'E11', 'E12', 'E13', 'E14']:
                    mun_cid = calculate_summary(df_mun_cid)
                    mun_cid['Municipio'] = mun
                    mun_cid['CID_Grupo'] = cid
                    all_records.append(mun_cid)
                    
        # Salvar CSV Agregado por Ano
        df_agregado = pd.DataFrame(all_records)
        output_file = os.path.join(output_dir, f'agregados_ano_{year}.csv')
        df_agregado.to_csv(output_file, index=False, sep=';', encoding='utf-8')
        print(f"Salvo: {output_file} com {len(df_agregado)} registros.")

if __name__ == "__main__":
    transform_diabetes()
