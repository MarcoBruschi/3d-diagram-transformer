'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useProcessingStore } from '@/store/useProcessingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { diagramService } from '@/lib/services/diagramService';
import { Sparkles, Code2, Play, AlertTriangle, Key } from 'lucide-react';

interface ArchitectureEditorProps {
  onSuccess?: () => void;
}

const TEMPLATES = [
  {
    name: '3-Tier Web',
    code: `[Client Browser]
  ↓
[API Server]
  ↓
[PostgreSQL Database]`,
  },
  {
    name: 'Microservices',
    code: `[Mobile Client] -> [API Gateway]
[API Gateway] -> [Auth Service]
[API Gateway] -> [Order Service]
[Order Service] -> [Kafka Queue] -> [Worker Service]
[Order Service] -> [Database Storage]`,
  },
  {
    name: 'Edge IoT',
    code: `[Sensor Node] -> [Edge Router]
[Workstation] -> [Edge Router]
[Edge Router] -> [Central Server]
[Central Server] -> [SAN Storage]`,
  },
  {
    name: 'Texto Livre (Gemini AI)',
    code: `Plataforma SaaS de E-commerce Escalável:
- Usuários acessam via Web e Mobile App através de um Cloudflare WAF e API Gateway Kong.
- O Gateway autentica via Auth Service (JWT + Redis Cache) e roteia para Order Service e Product Service.
- O Order Service processa pagamentos via Stripe e envia eventos para uma fila Kafka.
- Workers assíncronos consomem da fila para processar notas fiscais e emails.
- O banco de dados principal é PostgreSQL com ElasticSearch para catálogo.`,
  },
  {
    name: 'Draw.io XML (Caixa Eletrônico)',
    code: `<mxGraphModel dx="1030" dy="567" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#ffffff" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="comp_controlador" parent="1" style="html=1;dropTarget=0;whiteSpace=wrap;verticalAlign=top;spacingTop=4;" value="&lt;p style=&quot;margin:0px;margin-top:4px;text-align:center;&quot;&gt;«controller»&lt;/p&gt;&lt;hr size=&quot;1&quot;&gt;&lt;p style=&quot;margin:0px;margin-left:4px;text-align:center;&quot;&gt;&lt;b&gt;Controlador do Caixa Eletrônico&lt;/b&gt;&lt;/p&gt;" vertex="1">
      <mxGeometry height="80" width="220" x="100" y="160" as="geometry" />
    </mxCell>
    <mxCell id="comp_controlador_icon" parent="comp_controlador" style="shape=module;jettyWidth=8;jettyHeight=4;" value="" vertex="1">
      <mxGeometry height="20" relative="1" width="20" x="1" as="geometry">
        <mxPoint x="-27" y="7" as="offset" />
      </mxGeometry>
    </mxCell>
    <mxCell id="comp_gerenciador" parent="1" style="html=1;dropTarget=0;whiteSpace=wrap;verticalAlign=top;spacingTop=4;" value="&lt;p style=&quot;margin:0px;margin-top:4px;text-align:center;&quot;&gt;«executable»&lt;br&gt;&lt;/p&gt;&lt;hr size=&quot;1&quot;&gt;&lt;p style=&quot;margin:0px;margin-left:4px;text-align:center;&quot;&gt;&lt;b&gt;Gerenciador de Caixa Eletrônico&lt;/b&gt;&lt;/p&gt;" vertex="1">
      <mxGeometry height="80" width="240" x="580" y="160" as="geometry" />
    </mxCell>
    <mxCell id="comp_gerenciador_icon" parent="comp_gerenciador" style="shape=module;jettyWidth=8;jettyHeight=4;" value="" vertex="1">
      <mxGeometry height="20" relative="1" width="20" x="1" as="geometry">
        <mxPoint x="-27" y="7" as="offset" />
      </mxGeometry>
    </mxCell>
    <mxCell id="if_caixa" parent="1" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;" value="" vertex="1">
      <mxGeometry height="20" width="20" x="470" y="190" as="geometry" />
    </mxCell>
    <mxCell id="lbl_if_caixa" parent="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;fontSize=11;" value="&lt;b&gt;Interface Caixa Eletrônico&lt;/b&gt;" vertex="1">
      <mxGeometry height="30" width="160" x="380" y="155" as="geometry" />
    </mxCell>
    <mxCell id="edge_provided_caixa" edge="1" parent="1" source="comp_gerenciador" style="endArrow=none;html=1;rounded=0;strokeWidth=1.5;strokeColor=#000000;exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;" target="if_caixa" value="">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_required_caixa" edge="1" parent="1" source="comp_controlador" style="endArrow=halfCircle;endFill=0;endSize=12;html=1;rounded=0;strokeWidth=1.5;strokeColor=#000000;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" target="if_caixa" value="">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="comp_contas" parent="1" style="html=1;dropTarget=0;whiteSpace=wrap;verticalAlign=top;spacingTop=4;" value="&lt;p style=&quot;margin:0px;margin-top:4px;text-align:center;&quot;&gt;«service»&lt;/p&gt;&lt;hr size=&quot;1&quot;&gt;&lt;p style=&quot;margin:0px;margin-left:4px;text-align:center;&quot;&gt;&lt;b&gt;Gerenciador de Contas&lt;/b&gt;&lt;/p&gt;" vertex="1">
      <mxGeometry height="70" width="220" x="100" y="360" as="geometry" />
    </mxCell>
    <mxCell id="comp_contas_icon" parent="comp_contas" style="shape=module;jettyWidth=8;jettyHeight=4;" value="" vertex="1">
      <mxGeometry height="20" relative="1" width="20" x="1" as="geometry">
        <mxPoint x="-27" y="7" as="offset" />
      </mxGeometry>
    </mxCell>
    <mxCell id="dep_controlador_contas" edge="1" parent="1" source="comp_controlador" style="endArrow=open;dashed=1;html=1;rounded=0;strokeWidth=1.5;endFill=0;strokeColor=#000000;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" target="comp_contas" value="«use»">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="comp_cripto" parent="1" style="html=1;dropTarget=0;whiteSpace=wrap;verticalAlign=top;spacingTop=4;" value="&lt;p style=&quot;margin:0px;margin-top:4px;text-align:center;&quot;&gt;«secure»&lt;/p&gt;&lt;hr size=&quot;1&quot;&gt;&lt;p style=&quot;margin:0px;margin-left:4px;text-align:center;&quot;&gt;&lt;b&gt;Criptografia&lt;/b&gt;&lt;/p&gt;" vertex="1">
      <mxGeometry height="70" width="220" x="590" y="360" as="geometry" />
    </mxCell>
    <mxCell id="comp_cripto_icon" parent="comp_cripto" style="shape=module;jettyWidth=8;jettyHeight=4;" value="" vertex="1">
      <mxGeometry height="20" relative="1" width="20" x="1" as="geometry">
        <mxPoint x="-27" y="7" as="offset" />
      </mxGeometry>
    </mxCell>
    <mxCell id="dep_gerenciador_cripto" edge="1" parent="1" source="comp_gerenciador" style="endArrow=open;dashed=1;html=1;rounded=0;strokeWidth=1.5;endFill=0;strokeColor=#000000;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" target="comp_cripto" value="«use»">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>`,
  },
];

export function ArchitectureEditor({ onSuccess }: ArchitectureEditorProps) {
  const router = useRouter();
  const [text, setText] = useState(TEMPLATES[0].code);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [userApiKey, setUserApiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : ''));
  const setDiagram = useDiagramStore((s) => s.setDiagram);
  const startProcessing = useProcessingStore((s) => s.startProcessing);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    if (!useAuthStore.getState().isAuthenticated) {
      router.push('/login?redirect=/studio');
      return;
    }

    setError(null);
    try {
      await startProcessing(async () => {
        const diagram = await diagramService.parseText(text);
        setDiagram(diagram);
      });
      if (onSuccess) onSuccess();
      router.push('/studio');
    } catch (err: any) {
      console.error('[ArchitectureEditor] Generation failed:', err);
      setError({
        code: err?.code || 'INVALID_GEMINI_KEY',
        message: err?.message || 'Falha ao interpretar arquitetura com a Google Gemini API.',
      });
    }
  };

  const handleSaveKeyAndRetry = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', userApiKey.trim());
    }
    await handleGenerate();
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs space-y-3">
      {/* Template Quick Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-500 text-[11px]">Templates:</span>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.name}
            onClick={() => {
              setText(tmpl.code);
              setError(null);
            }}
            className="rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2 py-1 text-[10px] text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-300 transition-colors shadow-xs"
          >
            {tmpl.name}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="relative flex-1">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={`Digite ou cole sua arquitetura:
- Padrão Draw.io XML (<mxGraphModel...)
- Mermaid / PlantUML (graph TD...)
- Linguagem natural ou texto livre (ex: "Frontend React acessa API Gateway que se comunica com microsserviços e banco PostgreSQL")
Caso o texto não possua padrão Draw.io ou DSL convencional, a API do Google Gemini é obrigatoriamente utilizada.`}
          className="h-52 w-full resize-none rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-black/60 p-3 font-mono text-xs text-slate-900 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-sky-500 leading-relaxed shadow-inner transition-colors"
          spellCheck={false}
        />
      </div>

      {/* Error Banner when Gemini fails */}
      {error && (
        <div className="rounded-lg border border-rose-500/70 bg-rose-50 dark:bg-rose-950/40 p-3 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="text-[11px] font-bold text-rose-800 dark:text-rose-200">
                Interpretação Bloqueada: {error.code === 'MISSING_GEMINI_KEY' ? 'Chave de API Ausente' : 'Chave Inválida ou Quota Excedida'}
              </h5>
              <p className="text-[10px] text-rose-700 dark:text-rose-300 font-sans mt-0.5 leading-relaxed">
                {error.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="password"
                placeholder="Cole sua Google Gemini API Key (ex: AIzaSy...)"
                value={userApiKey}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setUserApiKey(val);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('gemini_api_key', val);
                  }
                }}
                className="w-full rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              onClick={handleSaveKeyAndRetry}
              disabled={!userApiKey.trim()}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
            >
              Salvar e Tentar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-sky-500" />
          <span>Formatos não convencionais requerem validação pela Google Gemini API</span>
        </div>
      </div>

      {/* Action CTA */}
      <button
        onClick={handleGenerate}
        className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 font-bold text-white shadow-lg hover:bg-sky-500 transition-all active:scale-[0.98]"
      >
        <Sparkles className="h-4 w-4" />
        <span>Sintetizar Arquitetura 3D (IA Gemini)</span>
      </button>
    </div>
  );
}
