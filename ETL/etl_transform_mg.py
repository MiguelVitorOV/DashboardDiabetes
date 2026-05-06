import pandas as pd
import os
import glob

def transform_mg():
    input_dir = 'data/extracted'
    output_dir = 'data/processed/mg'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    files = glob.glob(os.path.join(input_dir, 'diabetes_*.csv'))
    
    for file_path in files:
        year = os.path.basename(file_path).split('_')[1].replace('.csv', '')
        print(f"Transformando dados MG {year}...")
        
        df = pd.read_csv(file_path, sep=';')
        
        # Limpeza de idade (lidando com formatos como '40,0')
        if df['nu_idade'].dtype == object:
            df['nu_idade'] = df['nu_idade'].str.replace(',', '.').astype(float)
        
        summary = {
            'Total obitos': len(df),
            'Total masculino': len(df[df['tp_sexo'] == 'M']),
            'Total feminino': len(df[df['tp_sexo'] == 'F']),
            'Total branco': len(df[df['tp_raca_cor'] == 1]),
            'Total pardo': len(df[df['tp_raca_cor'] == 3]),
            'Total preto': len(df[df['tp_raca_cor'] == 2]),
            'Total amarelo': len(df[df['tp_raca_cor'] == 4]),
            'Total indigena': len(df[df['tp_raca_cor'] == 5]),
            'Total <10': len(df[df['nu_idade'] < 10]),
            'Total 10-14': len(df[(df['nu_idade'] >= 10) & (df['nu_idade'] <= 14)]),
            'Total 15-19': len(df[(df['nu_idade'] >= 15) & (df['nu_idade'] <= 19)]),
            'Total 20-24': len(df[(df['nu_idade'] >= 20) & (df['nu_idade'] <= 24)]),
            'Total 25-29': len(df[(df['nu_idade'] >= 25) & (df['nu_idade'] <= 29)]),
            'Total 30-34': len(df[(df['nu_idade'] >= 30) & (df['nu_idade'] <= 34)]),
            'Total 35-39': len(df[(df['nu_idade'] >= 35) & (df['nu_idade'] <= 39)]),
            'Total 40-44': len(df[(df['nu_idade'] >= 40) & (df['nu_idade'] <= 44)]),
            'Total 45-49': len(df[(df['nu_idade'] >= 45) & (df['nu_idade'] <= 49)]),
            'Total 50-54': len(df[(df['nu_idade'] >= 50) & (df['nu_idade'] <= 54)]),
            'Total 55-59': len(df[(df['nu_idade'] >= 55) & (df['nu_idade'] <= 59)]),
            'Total 60-64': len(df[(df['nu_idade'] >= 60) & (df['nu_idade'] <= 64)]),
            'Total 65-69': len(df[(df['nu_idade'] >= 65) & (df['nu_idade'] <= 69)]),
            'Total 70-74': len(df[(df['nu_idade'] >= 70) & (df['nu_idade'] <= 74)]),
            'Total 75-79': len(df[(df['nu_idade'] >= 75) & (df['nu_idade'] <= 79)]),
            'Total 80+': len(df[df['nu_idade'] >= 80])
        }
        
        res_df = pd.DataFrame([summary])
        
        # Adicionando linha de porcentagem
        pct_row = {}
        total = summary['Total obitos'] if summary['Total obitos'] > 0 else 1
        for col, val in summary.items():
            pct = (val / total) * 100
            pct_row[col] = f"{pct:.1f}%"
            
        res_df = pd.concat([res_df, pd.DataFrame([pct_row])], ignore_index=True)
        
        output_file = os.path.join(output_dir, f'dados_diabetes_processados_MG_{year}.csv')
        res_df.to_csv(output_file, index=False, sep=';', encoding='utf-8')

if __name__ == "__main__":
    transform_mg()
