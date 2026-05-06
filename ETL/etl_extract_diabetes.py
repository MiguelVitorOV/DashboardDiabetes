import pandas as pd
import os
import glob

def extract_diabetes():
    input_dir = 'data/raw'
    output_dir = 'data/extracted'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    csv_files = glob.glob(os.path.join(input_dir, 'dados_cronicas_SES_*.csv'))
    
    if not csv_files:
        print(f"Nenhum arquivo encontrado em {input_dir}")
        return

    for file_path in csv_files:
        filename = os.path.basename(file_path)
        year = filename.split('_')[-1].replace('.csv', '')
        
        print(f"Extraindo dados de {year}...")
        
        try:
            # Lendo com encoding latin1 e separador ; como observado nos arquivos da SES
            df = pd.read_csv(file_path, sep=';', encoding='latin1', low_memory=False)
            
            # Limpando espaços em branco dos nomes das colunas
            df.columns = df.columns.str.strip()
            
            # Filtrando por CID-10 Diabetes (E10 a E14)
            # A coluna co_cid_causa_basica contém o código
            diabetes_df = df[df['co_cid_causa_basica'].str.startswith(('E10', 'E11', 'E12', 'E13', 'E14'), na=False)]
            
            output_file = os.path.join(output_dir, f'diabetes_{year}.csv')
            diabetes_df.to_csv(output_file, index=False, sep=';', encoding='utf-8')
            print(f"Salvo: {output_file} ({len(diabetes_df)} registros)")
            
        except Exception as e:
            print(f"Erro ao processar {filename}: {e}")

if __name__ == "__main__":
    extract_diabetes()
