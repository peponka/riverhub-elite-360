// Use global fetch in Node 18+

class AIService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.GEMINI_KEY = process.env.GEMINI_API_KEY;
    }

    async generateContent(prompt, systemInstruction = '', temperature = 0.3, maxTokens = 2000, responseType = 'text/plain') {
        if (!this.GEMINI_KEY) throw new Error('AI not configured');
        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_KEY}`;
        
        const contents = [];
        if (systemInstruction) {
            contents.push({ parts: [{ text: systemInstruction }] });
        }
        contents.push({ parts: [{ text: prompt }] });

        const config = { temperature, maxOutputTokens: maxTokens };
        if (responseType === 'application/json') {
            config.responseMimeType = 'application/json';
        }

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: config
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    async chat(message, context) {
        const systemPrompt = `Eres el Copiloto IA de FluviaFleet, un sistema de gestión inteligente de flotas fluviales para la Hidrovía Paraguay-Paraná.
Tu rol:
- Experto en logística fluvial, navegación de barcos empujadores y barcazas
- Conoces sobre hidrología del Río Paraná y Paraguay
- Manejas temas de tripulación, combustible, mantenimiento naval
- Respondes en español rioplatense profesional
- Eres conciso pero completo (máx 150 palabras)
- Usas emojis marítimos cuando es apropiado (🚢⚓📡🌊)
- Si te preguntan datos específicos que no tenés, decí que necesitás consultar la base de datos

Contexto del sistema: ${context || 'Usuario operador de flota'}`;

        const text = await this.generateContent(message, systemPrompt, 0.7, 500);
        if (!text) throw new Error('Empty response from AI');
        return { response: text };
    }

    async predictMaintenance(companyId) {
        if (!this.supabase) throw new Error('Supabase not configured');

        // Parallel queries using Supabase SDK
        const [vesselsRes, maintRes, fuelRes] = await Promise.all([
            this.supabase.from('vessels').select('id,name,type,status,draft,current_draft,max_draft,engine_power').eq('company_id', companyId),
            this.supabase.from('maintenance_tasks').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50),
            this.supabase.from('fuel_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50)
        ]);

        const vessels = vesselsRes.data || [];
        const maintenance = maintRes.data || [];
        const fuel = fuelRes.data || [];

        if (vessels.length === 0) {
            return [{
                vessel: 'Sin datos', component: 'N/A', probability: 0, days_until: 0,
                action: 'Registre embarcaciones para recibir predicciones de IA', severity: 'low'
            }];
        }

        const prompt = `DATOS DE LA FLOTA:
${JSON.stringify(vessels)}

HISTORIAL DE MANTENIMIENTO:
${JSON.stringify(maintenance)}

REGISTROS DE COMBUSTIBLE:
${JSON.stringify(fuel)}

TAREA: Analiza estos datos y genera predicciones de mantenimiento para cada embarcación activa. Para cada una:
1. Componente en riesgo
2. Probabilidad de falla (%) en los próximos 30 días
3. Días estimados hasta mantenimiento necesario
4. Acción recomendada
5. Severidad: critical/high/medium/low

Responde SOLO en JSON válido, formato:
[{"vessel":"nombre","component":"componente","probability":85,"days_until":12,"action":"descripción corta","severity":"high"}]`;

        const systemPrompt = 'Eres un ingeniero naval experto en mantenimiento predictivo de flotas fluviales en la Hidrovía Paraguay-Paraná.';
        const text = await this.generateContent(prompt, systemPrompt, 0.3, 2000, 'application/json');
        
        try {
            return JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        }
    }

    async optimizeConvoy(companyId, destination, selectedVessels) {
        if (!this.supabase) throw new Error('Supabase not configured');

        const { data: vessels } = await this.supabase.from('vessels').select('*').eq('company_id', companyId);

        if (!vessels || vessels.length === 0) {
            return {
                config: 'Sin datos', risk_score: 0, formation: {},
                warnings: ['No se encontraron embarcaciones'],
                recommendation: 'Registre embarcaciones primero para recibir sugerencias de IA.'
            };
        }

        const prompt = `FLOTA DISPONIBLE:
${JSON.stringify(vessels)}

${selectedVessels ? 'EMBARCACIONES SELECCIONADAS: ' + selectedVessels : 'Sin selección.'}
${destination ? 'DESTINO: ' + destination : 'Sin destino definido.'}

CONTEXTO HIDROLÓGICO:
- Río Paraguay en Asunción: 2.4m
- Pilcomayo-Confluencia: calado máximo 2.8m
- Confluencia-Rosario: calado máximo 3.2m

TAREA: Sugiere la formación ÓPTIMA.
Responde SOLO en JSON válido:
{"formation":{"proa":"nombre","barcazas_f1":["n1","n2"],"barcazas_f2":["n3"],"popa":"nombre o null"},"config":"2+1","risk_score":25,"risk_level":"bajo/medio/alto","warnings":["adv"],"fuel_estimate_liters":12000,"recommendation":"texto"}`;

        const systemPrompt = 'Eres un despachante naval experto de la Hidrovía Paraguay-Paraná con 20 años de experiencia en formación de convoyes.';
        const text = await this.generateContent(prompt, systemPrompt, 0.3, 1500, 'application/json');

        try {
            return JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        }
    }

    async detectFuelAnomalies(companyId) {
        if (!this.supabase) throw new Error('Supabase not configured');

        const [fuelRes, vesselsRes] = await Promise.all([
            this.supabase.from('fuel_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100),
            this.supabase.from('vessels').select('id,name,type,engine_power').eq('company_id', companyId)
        ]);

        const fuelLogs = fuelRes.data || [];
        const vessels = vesselsRes.data || [];

        const prompt = `EMBARCACIONES:
${JSON.stringify(vessels)}

REGISTROS DE COMBUSTIBLE:
${JSON.stringify(fuelLogs)}

TAREA: Analiza patrones y detecta ANOMALÍAS (consumo inusual, diferencias de carga, riesgos de robo/fuga).
Responde en JSON:
[{"vessel":"nombre","type":"overconsumption/spike/trend/theft_risk","severity":"critical/high/medium/low","description":"descripción","deviation_pct":15,"recommendation":"acción"}]`;

        const systemPrompt = 'Eres un auditor de consumo de combustible especializado en flotas fluviales.';
        const text = await this.generateContent(prompt, systemPrompt, 0.3, 1500, 'application/json');

        try {
            return JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        }
    }

    async analyzeInvoice(invoiceText, voyageId) {
        let voyageContext = '';
        if (voyageId && this.supabase) {
            const { data: voyage } = await this.supabase.from('voyages').select('*').eq('id', voyageId).single();
            if (voyage) {
                voyageContext = `\nDatos del viaje: Origen: ${voyage.origin}, Destino: ${voyage.destination}, Carga: ${voyage.cargo_tons}tn, Combustible: ${voyage.fuel_consumed}L.`;
            }
        }

        const systemPrompt = `Eres el motor de Invoice Intelligence de FluviaFleet. Analiza facturas de flete.
Extrae JSON exacto:
{
  "invoice": {"number": "x", "date": "x", "supplier": "x", "total": 0, "currency": "x", "items": [{"description": "x", "quantity": 0, "unit": "x", "unitPrice": 0, "subtotal": 0}]},
  "validation": {"mathCorrect": true, "discrepancies": [{"field": "x", "invoiceValue": "x", "systemValue": "x", "difference": "x", "severity": "CRITICA", "note": "x"}]},
  "summary": {"status": "APROBADA", "confidence": 95, "notes": "x"}
}${voyageContext}`;

        const text = await this.generateContent(`FACTURA:\n${invoiceText}`, systemPrompt, 0.2, 4000, 'application/json');

        let result = null;
        try {
            result = JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) result = JSON.parse(jsonMatch[0]);
        }
        return { result, raw: text };
    }
}

module.exports = AIService;
