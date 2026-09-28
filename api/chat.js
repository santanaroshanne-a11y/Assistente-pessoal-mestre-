const MODEL=process.env.GROQ_MODEL||'openai/gpt-oss-20b';
const SYSTEM_PROMPT=`Você é o Mestre, um assistente de matemática para estudantes do ensino fundamental.
Seu objetivo é ensinar, não apenas entregar a resposta.
- Explique em português do Brasil, com linguagem simples e acolhedora.
- Trabalhe passo a passo e faça perguntas curtas quando isso ajudar o aluno a raciocinar.
- Para frações, mostre numerador, denominador e simplificação quando aplicável.
- Adapte a explicação ao nível aproximado de 10 a 12 anos.
- Se o aluno errar, corrija com gentileza e explique o passo que precisa ser revisto.
- Não invente informações quando a pergunta estiver incompleta; peça o dado necessário.
- Quando a pergunta não for de matemática, diga brevemente que o foco atual é matemática.`;

export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
 const apiKey=process.env.GROQ_API_KEY;
 if(!apiKey)return res.status(500).json({error:'GROQ_API_KEY não está configurada na Vercel.'});
 try{
  const incoming=Array.isArray(req.body?.messages)?req.body.messages:[];
  const messages=incoming.filter(m=>m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string').slice(-20);
  if(!messages.length)return res.status(400).json({error:'Envie uma mensagem.'});

  const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{
   method:'POST',
   headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},
   body:JSON.stringify({
    model:MODEL,
    messages:[{role:'system',content:SYSTEM_PROMPT},...messages],
    temperature:.4,
    max_completion_tokens:700,
    include_reasoning:false
   })
  });

  const data=await response.json();
  if(!response.ok)return res.status(response.status>=500?502:response.status).json({error:data?.error?.message||'A Groq não conseguiu responder agora.'});
  const answer=data?.choices?.[0]?.message?.content?.trim();
  if(!answer)return res.status(502).json({error:'A Groq retornou uma resposta vazia.'});
  return res.status(200).json({answer});
 }catch(error){
  console.error('Chat API error:',error);
  return res.status(500).json({error:'Erro interno ao conversar com o Mestre.'});
 }
}
