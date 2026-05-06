import pandas as pd
import os
import glob

def calculate_summary(df):
    """Calcula os totais demográficos para um DataFrame fornecido."""
    if df.empty:
        return {col: 0 for col in [
            'Obitos', 'Masculino', 'Feminino', 
            'Branco', 'Pardo', 'Preto', 
            'Amarelo', 'Indigena', 'Jovens (10-29)', '<10'
        ] + [f'{age}' for age in [
            '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', 
            '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', 
            '70-74', '75-79', '80+'
        ]]}

    # Limpeza de dados
    df = df.copy()
    df['sg_sexo'] = df['sg_sexo'].astype(str).str.strip().str.upper()
    df['tp_raca_cor'] = df['tp_raca_cor'].astype(str).str.strip().str.upper()
    df['nu_idade'] = df['nu_idade'].astype(str).str.replace(',', '.').str.strip()
    
    df['nu_idade'] = pd.to_numeric(df['nu_idade'], errors='coerce')
    # Identificar coluna de município
    mun_col = 'co_municipio_ibge_residencia' if 'co_municipio_ibge_residencia' in df.columns else 'co_municipio_residencia'
    if mun_col in df.columns:
        df[mun_col] = pd.to_numeric(df[mun_col], errors='coerce')

    summary = {
        'Obitos': len(df),
        'Masculino': len(df[df['sg_sexo'].str.startswith('M', na=False)]),
        'Feminino': len(df[df['sg_sexo'].str.startswith('F', na=False)]),
        'Branco': len(df[df['tp_raca_cor'].str.contains('BRANC', na=False)]),
        'Pardo': len(df[df['tp_raca_cor'].str.contains('PARD', na=False)]),
        'Preto': len(df[df['tp_raca_cor'].str.contains('PRET', na=False)]),
        'Amarelo': len(df[df['tp_raca_cor'].str.contains('AMAREL', na=False)]),
        'Indigena': len(df[df['tp_raca_cor'].str.contains('INDIG', na=False)]),
        'Jovens (10-29)': len(df[(df['nu_idade'] >= 10) & (df['nu_idade'] <= 29)]),
        '<10': len(df[df['nu_idade'] < 10]),
        '10-14': len(df[(df['nu_idade'] >= 10) & (df['nu_idade'] <= 14)]),
        '15-19': len(df[(df['nu_idade'] >= 15) & (df['nu_idade'] <= 19)]),
        '20-24': len(df[(df['nu_idade'] >= 20) & (df['nu_idade'] <= 24)]),
        '25-29': len(df[(df['nu_idade'] >= 25) & (df['nu_idade'] <= 29)]),
        '30-34': len(df[(df['nu_idade'] >= 30) & (df['nu_idade'] <= 34)]),
        '35-39': len(df[(df['nu_idade'] >= 35) & (df['nu_idade'] <= 39)]),
        '40-44': len(df[(df['nu_idade'] >= 40) & (df['nu_idade'] <= 44)]),
        '45-49': len(df[(df['nu_idade'] >= 45) & (df['nu_idade'] <= 49)]),
        '50-54': len(df[(df['nu_idade'] >= 50) & (df['nu_idade'] <= 54)]),
        '55-59': len(df[(df['nu_idade'] >= 55) & (df['nu_idade'] <= 59)]),
        '60-64': len(df[(df['nu_idade'] >= 60) & (df['nu_idade'] <= 64)]),
        '65-69': len(df[(df['nu_idade'] >= 65) & (df['nu_idade'] <= 69)]),
        '70-74': len(df[(df['nu_idade'] >= 70) & (df['nu_idade'] <= 74)]),
        '75-79': len(df[(df['nu_idade'] >= 75) & (df['nu_idade'] <= 79)]),
        '80+': len(df[df['nu_idade'] >= 80])
    }
    return summary

def format_with_percentages(summary):
    """Transforma o dicionário de resumo em DataFrame com linha de porcentagem."""
    df = pd.DataFrame([summary])
    total = summary['Obitos']
    
    pct_row = {}
    for col in df.columns:
        if total > 0:
            pct = (summary[col] / total) * 100
            pct_row[col] = f"{pct:.1f}%"
        else:
            pct_row[col] = "0.0%"
            
    df_pct = pd.DataFrame([pct_row])
    return pd.concat([df, df_pct], ignore_index=True)

def transform_diabetes():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(base_dir, 'data/extracted')
    mg_output_dir = os.path.join(base_dir, 'data/processed/mg')
    matipo_output_dir = os.path.join(base_dir, 'data/processed/matipo')
    
    # Garantir diretórios de saída
    for d in [mg_output_dir, matipo_output_dir]:
        os.makedirs(d, exist_ok=True)
    
    files = glob.glob(os.path.join(input_dir, 'diabetes_*.csv'))
    
    for file_path in files:
        year = os.path.basename(file_path).split('_')[1].replace('.csv', '')
        print(f"Transformando dados de {year}...")
        
        # Usar latin1 para evitar erros de encoding com caracteres especiais
        df_full = pd.read_csv(file_path, sep=';', encoding='latin1')
        
        # 1. Processar Minas Gerais (Total do arquivo)
        mg_summary = calculate_summary(df_full)
        mg_df = format_with_percentages(mg_summary)
        mg_df.to_csv(os.path.join(mg_output_dir, f'dados_diabetes_processados_MG_{year}.csv'), index=False, sep=';', encoding='utf-8')
        
        # 2. Processar Matipó (Filtro por código 314070)
        mun_col = 'co_municipio_ibge_residencia' if 'co_municipio_ibge_residencia' in df_full.columns else 'co_municipio_residencia'
        # Filtro robusto para o nome do município (Matipó)
        df_matipo = df_full[df_full[mun_col].astype(str).str.contains('Matip', case=False, na=False)].copy()
        
        matipo_summary = calculate_summary(df_matipo)
        matipo_df = format_with_percentages(matipo_summary)
        matipo_df.to_csv(os.path.join(matipo_output_dir, f'dados_diabetes_processados_Matipo_{year}.csv'), index=False, sep=';', encoding='utf-8')

if __name__ == "__main__":
    transform_diabetes()
