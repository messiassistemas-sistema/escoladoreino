-- Add courses_data column to landing_page_content
ALTER TABLE landing_page_content 
ADD COLUMN IF NOT EXISTS courses_data JSONB DEFAULT '[
  {
    "title": "Teologia Sistemática",
    "description": "Um estudo aprofundado das doutrinas fundamentais da fé cristã, desde a doutrina de Deus até a escatologia.",
    "duration": "2 anos",
    "level": "Básico ao Avançado",
    "features": [
      "Bibliologia e Hermenêutica",
      "Doutrina de Deus e Cristo",
      "Soteriologia e Pneumatologia",
      "Eclesiologia"
    ]
  },
  {
    "title": "Liderança Ministerial",
    "description": "Formação prática para quem deseja liderar com excelência no Reino de Deus.",
    "duration": "1 ano",
    "level": "Liderança",
    "features": [
      "Caráter do Líder",
      "Gestão de Pessoas",
      "Planejamento Ministerial",
      "Aconselhamento Pastoral"
    ]
  },
  {
    "title": "Panorama Bíblico",
    "description": "Uma jornada completa por todos os livros da Bíblia, entendendo o contexto e mensagem de cada um.",
    "duration": "1 ano",
    "level": "Introdutório",
    "features": [
      "Antigo Testamento",
      "Novo Testamento",
      "História de Israel",
      "Geografia Bíblica"
    ]
  }
]'::jsonb;
