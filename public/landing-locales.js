(function () {
  'use strict';

  var language = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
  var copy = {
    en: {
      'Plataforma': 'Platform', 'Cómo funciona': 'How it works', 'Precios': 'Pricing', 'Hidrovía': 'Waterway', 'Nosotros': 'About us',
      'Ingresar': 'Sign in', 'Pedir demo': 'Request a demo', 'Crear cuenta': 'Create account', 'Iniciar sesión': 'Sign in',
      'HIDROVÍA PARAGUAY-PARANÁ, EN TIEMPO REAL': 'PARAGUAY-PARANÁ WATERWAY, IN REAL TIME',
      'Cada barcaza, visible.': 'Every barge, visible.', 'Cada decisión, a tiempo.': 'Every decision, on time.',
      'AIS, convoyes, combustible y mantenimiento de tu flota en una sola pantalla. Conectás tus datos y arrancás hoy.': 'AIS, convoys, fuel and fleet maintenance on one screen. Connect your data and get started today.',
      'Flota conectada': 'Connected fleet', 'Posición y estado de cada unidad.': 'Position and status of every vessel.',
      'IA predictiva': 'Predictive AI', 'Alertas antes de que algo se atrase.': 'Alerts before anything falls behind.',
      'Lista en minutos': 'Ready in minutes', 'Sin instalar hardware adicional.': 'No additional hardware to install.',
      'POR QUÉ VIABARCAZAS': 'WHY VIABARCAZAS', 'Hecho a la medida': 'Built around', 'del río.': 'the river.',
      'KM DE RÍO BAJO SEGUIMIENTO': 'KM OF WATERWAY MONITORED', 'MÓDULOS EN UN SOLO PANEL': 'MODULES IN ONE DASHBOARD', 'PAÍSES EN LA MISMA RUTA': 'COUNTRIES ON THE SAME ROUTE', 'PARA VER TU PRIMER DATO': 'TO SEE YOUR FIRST DATA POINT',
      'TODO EL SISTEMA': 'THE WHOLE SYSTEM', 'Cada frente de tu operación,': 'Every part of your operation,', 'bajo un mismo techo.': 'under one roof.',
      'Del AIS a la última factura de gasoil, los 12 frentes de tu operación viven en la misma pantalla.': 'From AIS to the latest fuel invoice, all 12 areas of your operation live on the same screen.',
      'AHORA': 'NOW', 'PLANIFICACIÓN': 'PLANNING', 'GESTIÓN': 'MANAGEMENT', 'Flota': 'Fleet', 'Mapa AIS': 'AIS Map', 'Combustible': 'Fuel', 'Alertas': 'Alerts', 'Armador de Convoy': 'Convoy Builder', 'Viajes': 'Voyages', 'Copiloto IA': 'AI Copilot', 'Mantenimiento': 'Maintenance', 'Bitácora Digital': 'Digital Logbook', 'Tripulación': 'Crew', 'Puertos': 'Ports', 'Reportes': 'Reports',
      'PUESTA EN MARCHA': 'GETTING STARTED', 'No es un proyecto de meses.': 'It is not a months-long project.', 'Es un lunes distinto.': 'It is a different Monday.',
      'Así se ve tu primer mes con ViaBarcazas, de la carga inicial de datos a los primeros números para mostrar.': 'This is what your first month with ViaBarcazas looks like, from loading initial data to your first results.',
      'DÍA 1': 'DAY 1', 'DÍA 2': 'DAY 2', 'SEMANA 1': 'WEEK 1', 'MES 1': 'MONTH 1',
      'INTELIGENCIA ARTIFICIAL': 'ARTIFICIAL INTELLIGENCE', 'Preguntale al río': 'Ask the river', 'lo que necesites saber.': 'what you need to know.', 'Preguntá en español. Respondemos con datos de tu operación real.': 'Ask in English. Get answers from your real operational data.', 'Solicitar Demo': 'Request a demo',
      'ANALÍTICA': 'ANALYTICS', 'Analítica de flota': 'Fleet analytics', 'avanzada.': 'advanced.', 'Los mismos datos que ves en el panel operativo, resumidos para el que firma los números.': 'The same data you see in the operations dashboard, summarized for the people who sign off on the numbers.',
      'LA PLATA QUE SE ESCAPA': 'HIDDEN COSTS', 'Poné los números de tu flota': 'Enter your fleet numbers', 'y mirá cuánto se pierde.': 'and see what is being lost.', 'Ingresá los datos de tu flota y veé el impacto proyectado en tiempo real. Sin registro.': 'Enter your fleet data and see the projected impact in real time. No sign-up required.',
      'Barcazas': 'Barges', 'Remolcadores': 'Tugboats', 'Combustible mensual (kL)': 'Monthly fuel (kL)', 'Costo por litro (USD)': 'Cost per litre (USD)', 'RESUMEN — TU FLOTA HOY': 'SUMMARY — YOUR FLEET TODAY', 'Combustible mal gastado / año': 'Fuel wasted / year', 'Plan ViaBarcazas / mes': 'ViaBarcazas plan / month', 'Ahorro neto, año 1': 'Net savings, year 1', 'Hablar con un especialista sobre tu flota': 'Talk to a fleet specialist',
      'CASO DE ÉXITO': 'SUCCESS STORY', 'Así lo usa un operador': 'How a real', 'real de la hidrovía.': 'waterway operator uses it.', 'PRECIOS': 'PRICING', 'Tres tamaños de flota,': 'Three fleet sizes,', 'un solo panel.': 'one dashboard.', '14 días de prueba gratis': '14-day free trial', 'Operativo en 5 minutos': 'Operational in 5 minutes', 'Sin tarjeta para empezar': 'No card required to start',
      'PREGUNTAS FRECUENTES': 'FREQUENTLY ASKED QUESTIONS', 'Respuestas a lo que': 'Answers to what', 'todos preguntan.': 'everyone asks.', 'NOSOTROS': 'ABOUT US', '¿Quiénes somos?': 'Who are we?', 'LA DIFERENCIA': 'THE DIFFERENCE', 'CONTACTO': 'CONTACT', 'Contanos cómo opera': 'Tell us how', 'tu flota hoy.': 'your fleet operates today.', 'Nombre *': 'Name *', 'Empresa *': 'Company *', 'País': 'Country', 'Tamaño de flota': 'Fleet size', 'Mensaje (opcional)': 'Message (optional)', 'Enviar Solicitud': 'Send request', 'Escribinos por WhatsApp': 'Message us on WhatsApp', 'Respuesta inmediata': 'Immediate response', 'Agendar Demo': 'Schedule a demo', 'Elegí día y horario': 'Choose a day and time', 'Todos los derechos reservados.': 'All rights reserved.'
    },
    pt: {
      'Plataforma': 'Plataforma', 'Cómo funciona': 'Como funciona', 'Precios': 'Preços', 'Hidrovía': 'Hidrovia', 'Nosotros': 'Sobre nós',
      'Ingresar': 'Entrar', 'Pedir demo': 'Solicitar demonstração', 'Crear cuenta': 'Criar conta', 'Iniciar sesión': 'Entrar',
      'HIDROVÍA PARAGUAY-PARANÁ, EN TIEMPO REAL': 'HIDROVIA PARAGUAI-PARANÁ, EM TEMPO REAL',
      'Cada barcaza, visible.': 'Cada barcaça, visível.', 'Cada decisión, a tiempo.': 'Cada decisão, no tempo certo.',
      'AIS, convoyes, combustible y mantenimiento de tu flota en una sola pantalla. Conectás tus datos y arrancás hoy.': 'AIS, comboios, combustível e manutenção da sua frota em uma única tela. Conecte seus dados e comece hoje.',
      'Flota conectada': 'Frota conectada', 'Posición y estado de cada unidad.': 'Posição e estado de cada embarcação.', 'IA predictiva': 'IA preditiva', 'Alertas antes de que algo se atrase.': 'Alertas antes que algo atrase.', 'Lista en minutos': 'Pronta em minutos', 'Sin instalar hardware adicional.': 'Sem instalar hardware adicional.',
      'POR QUÉ VIABARCAZAS': 'POR QUE A VIABARCAZAS', 'Hecho a la medida': 'Feita sob medida', 'del río.': 'para o rio.', 'TODO EL SISTEMA': 'TODO O SISTEMA', 'Cada frente de tu operación,': 'Todas as frentes da sua operação,', 'bajo un mismo techo.': 'em um só lugar.',
      'Del AIS a la última factura de gasoil, los 12 frentes de tu operación viven en la misma pantalla.': 'Do AIS à última fatura de combustível, as 12 áreas da sua operação ficam na mesma tela.', 'AHORA': 'AGORA', 'PLANIFICACIÓN': 'PLANEJAMENTO', 'GESTIÓN': 'GESTÃO', 'Flota': 'Frota', 'Mapa AIS': 'Mapa AIS', 'Combustible': 'Combustível', 'Alertas': 'Alertas', 'Armador de Convoy': 'Montador de Comboios', 'Viajes': 'Viagens', 'Copiloto IA': 'Copiloto IA', 'Mantenimiento': 'Manutenção', 'Bitácora Digital': 'Diário de Bordo Digital', 'Tripulación': 'Tripulação', 'Puertos': 'Portos', 'Reportes': 'Relatórios',
      'PUESTA EN MARCHA': 'IMPLANTAÇÃO', 'No es un proyecto de meses.': 'Não é um projeto de meses.', 'Es un lunes distinto.': 'É uma segunda-feira diferente.', 'DÍA 1': 'DIA 1', 'DÍA 2': 'DIA 2', 'SEMANA 1': 'SEMANA 1', 'MES 1': 'MÊS 1',
      'INTELIGENCIA ARTIFICIAL': 'INTELIGÊNCIA ARTIFICIAL', 'Preguntale al río': 'Pergunte ao rio', 'lo que necesites saber.': 'o que você precisa saber.', 'Preguntá en español. Respondemos con datos de tu operación real.': 'Pergunte em português. Respondemos com dados da sua operação real.', 'Solicitar Demo': 'Solicitar demonstração',
      'ANALÍTICA': 'ANÁLISE', 'Analítica de flota': 'Análise de frota', 'avanzada.': 'avançada.', 'LA PLATA QUE SE ESCAPA': 'CUSTOS OCULTOS', 'Poné los números de tu flota': 'Informe os dados da sua frota', 'y mirá cuánto se pierde.': 'e veja quanto se perde.', 'Barcazas': 'Barcaças', 'Remolcadores': 'Rebocadores', 'Combustible mensual (kL)': 'Combustível mensal (kL)', 'Costo por litro (USD)': 'Custo por litro (USD)', 'RESUMEN — TU FLOTA HOY': 'RESUMO — SUA FROTA HOJE', 'Combustible mal gastado / año': 'Combustível desperdiçado / ano', 'Plan ViaBarcazas / mes': 'Plano ViaBarcazas / mês', 'Ahorro neto, año 1': 'Economia líquida, ano 1', 'Hablar con un especialista sobre tu flota': 'Fale com um especialista em frotas',
      'CASO DE ÉXITO': 'CASO DE SUCESSO', 'Así lo usa un operador': 'Como um operador', 'real de la hidrovía.': 'real da hidrovia utiliza.', 'PRECIOS': 'PREÇOS', 'Tres tamaños de flota,': 'Três tamanhos de frota,', 'un solo panel.': 'um só painel.', '14 días de prueba gratis': '14 dias de teste grátis', 'Operativo en 5 minutos': 'Operacional em 5 minutos', 'Sin tarjeta para empezar': 'Sem cartão para começar',
      'PREGUNTAS FRECUENTES': 'PERGUNTAS FREQUENTES', 'Respuestas a lo que': 'Respostas ao que', 'todos preguntan.': 'todos perguntam.', 'NOSOTROS': 'SOBRE NÓS', '¿Quiénes somos?': 'Quem somos?', 'LA DIFERENCIA': 'A DIFERENÇA', 'CONTACTO': 'CONTATO', 'Contanos cómo opera': 'Conte como opera', 'tu flota hoy.': 'sua frota hoje.', 'Nombre *': 'Nome *', 'Empresa *': 'Empresa *', 'País': 'País', 'Tamaño de flota': 'Tamanho da frota', 'Mensaje (opcional)': 'Mensagem (opcional)', 'Enviar Solicitud': 'Enviar solicitação', 'Escribinos por WhatsApp': 'Fale conosco pelo WhatsApp', 'Respuesta inmediata': 'Resposta imediata', 'Agendar Demo': 'Agendar demonstração', 'Elegí día y horario': 'Escolha dia e horário', 'Todos los derechos reservados.': 'Todos os direitos reservados.'
    }
  };
  var dictionary = copy[language];
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(function (node) {
    var value = node.nodeValue;
    var key = value.trim();
    if (!dictionary[key]) return;
    node.nodeValue = value.replace(key, dictionary[key]);
  });
  var attributes = language === 'en'
    ? {'Tu nombre completo':'Your full name','Nombre de la empresa':'Company name','Seleccionar país':'Select country','Seleccionar tamaño':'Select size','Contanos sobre tu operación...':'Tell us about your operation...'}
    : {'Tu nombre completo':'Seu nome completo','Nombre de la empresa':'Nome da empresa','Seleccionar país':'Selecione o país','Seleccionar tamaño':'Selecione o tamanho','Contanos sobre tu operación...':'Conte-nos sobre a sua operação...'};
  document.querySelectorAll('[placeholder], option').forEach(function (element) {
    var value = element.getAttribute('placeholder') || element.textContent.trim();
    if (!attributes[value]) return;
    if (element.hasAttribute('placeholder')) element.setAttribute('placeholder', attributes[value]);
    else element.textContent = attributes[value];
  });
  document.querySelectorAll('a[href="pricing.html"]').forEach(function (link) { link.href = language === 'en' ? 'pricing-en.html' : 'pricing-pt.html'; });
  document.querySelectorAll('a[href="blog.html"]').forEach(function (link) { link.href = language === 'en' ? 'blog-viabarcazas-en.html' : 'blog.html'; });
  document.querySelectorAll('a[href*="wa.me/"]').forEach(function (link) {
    link.href = language === 'en'
      ? 'https://wa.me/595994207248?text=Hello,%20I%20would%20like%20to%20learn%20about%20ViaBarcazas%20for%20my%20waterway%20fleet.'
      : 'https://wa.me/595994207248?text=Olá,%20quero%20conhecer%20a%20ViaBarcazas%20para%20gerenciar%20minha%20frota%20na%20hidrovia.';
  });
}());
