/**
 * ERIX STUDIO DESIGN — QUIZ DE TRIAGEM (LÓGICA CORRIGIDA DE QUALIFICAÇÃO)
 *
 * Perguntas 1-3 (situação atual) NÃO pontuam para qualificação.
 * Servem apenas para identificar a dor principal, usada para personalizar
 * a mensagem de abertura no WhatsApp.
 *
 * Perguntas 4-5 (prioridade + abertura para investir) é que decidem o destino:
 * - Se AMBAS tiverem alguma resposta positiva (> 0)  => Lead qualificado -> WhatsApp
 * - Se QUALQUER UMA for "não é foco" / "só pesquisar" (0) => Lead a nutrir -> Instagram
 *
 * Isto evita que alguém que já tem tudo resolvido (mas sem intenção de compra)
 * seja enviado para o WhatsApp, e evita que alguém com muita dor mas também
 * muita intenção de compra seja descartado para o Instagram.
 */

const WHATSAPP_NUMBER = "5581984916271";
const INSTAGRAM_URL = "https://www.instagram.com/erix.studio.design/";

// Ordem de prioridade: a primeira dor encontrada nesta lista, entre as
// respondidas pela pessoa, é considerada a dor principal para a mensagem.
const DOR_PRIORIDADE = [
    "sem-site",
    "pouca-presenca",
    "so-redes",
    "site-desatualizado",
    "dificil-agendar",
    "agendamento-parcial"
];

const DOR_FRASES = {
    "sem-site": "ainda não tenho uma página profissional",
    "pouca-presenca": "quando pesquisam por mim online, aparece pouca informação",
    "so-redes": "atualmente só tenho redes sociais, sem site próprio",
    "site-desatualizado": "o meu site já está desatualizado e não me representa",
    "dificil-agendar": "não tenho um sistema simples para os pacientes marcarem consulta",
    "agendamento-parcial": "o agendamento de consultas ainda podia ser mais simples",
    "default": "gostaria de perceber como posso elevar ainda mais a minha presença digital"
};

/**
 * PONTUAÇÃO DA AVALIAÇÃO PERSONALIZADA
 *
 * Baseada nas perguntas 1-3 (situação atual da presença online).
 * Cada resposta soma pontos numa escala própria por pergunta.
 * A soma bruta é depois reescalada para o intervalo permitido (58 a 85),
 * nunca abaixo nem acima disso, para que o resultado pareça sempre
 * uma avaliação real e nunca uma nota extrema ou perfeita.
 */
const SCORE_MIN = 58;
const SCORE_MAX = 85;

const SCORE_PONTOS = {
    q1: { "sem-site": 0, "site-desatualizado": 8, "": 20 },
    q2: { "pouca-presenca": 0, "so-redes": 5, "": 15 },
    q3: { "dificil-agendar": 0, "agendamento-parcial": 5, "": 10 }
};
const SCORE_RAW_MAX = 45; // 20 + 15 + 10

// Textos de diagnóstico personalizados por resposta (Etapas 1, 2 e 3)
const DIAGNOSTICO_Q1 = {
    "sem-site": "A sua presença online depende principalmente das redes sociais, sem uma página profissional própria.",
    "site-desatualizado": "Já tem uma base online, mas o site atual pode não estar a refletir o profissionalismo da sua prática.",
    "": "Já possui uma página profissional, o que é uma boa base para o próximo passo."
};
const DIAGNOSTICO_Q2 = {
    "pouca-presenca": "Quando pesquisam pelo seu nome, aparece pouca informação relevante, o que pode gerar hesitação em potenciais pacientes.",
    "so-redes": "A sua presença no Google depende sobretudo das redes sociais, sem uma página própria a reforçar a credibilidade.",
    "": "É encontrada com facilidade no Google, o que já ajuda na primeira impressão."
};
const DIAGNOSTICO_Q3 = {
    "dificil-agendar": "O processo de marcação depende exclusivamente do telefone, o que pode afastar quem prefere resolver tudo online.",
    "agendamento-parcial": "O agendamento já existe, mas ainda depende de trocas manuais que podem ser simplificadas.",
    "": "Já tem um sistema de marcação simples, o que facilita o primeiro contacto."
};

function getClassificacao(score) {
    if (score <= 64) return "Presença online em desenvolvimento";
    if (score <= 74) return "Boa presença profissional";
    return "Presença profissional sólida";
}

// Preservação de parâmetros UTM se disponíveis
function getAdSource() {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") || "";
    const medium = params.get("utm_medium") || "";
    const campaign = params.get("utm_campaign") || "";

    let parts = [];
    if (source) parts.push(source);
    if (medium) parts.push(medium);
    if (campaign) parts.push(campaign);

    return parts.join(" - ");
}

function buildWhatsappUrl(message) {
    const source = getAdSource();
    let finalMessage = message;
    if (source) {
        finalMessage += ` [Origem: ${source}]`;
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
}

document.addEventListener("DOMContentLoaded", () => {

    let currentStep = 0;
    const intentScores = { 4: 0, 5: 0 };
    const dores = { 1: "", 2: "", 3: "" };

    const quizSteps = document.querySelectorAll(".quiz-step");
    const quizSection = document.getElementById("quizSection");
    const quizCard = document.getElementById("quizCard");
    const progressWrapper = document.getElementById("quizProgressWrapper");
    const progressFill = document.getElementById("quizProgressFill");
    const stepCounter = document.getElementById("quizStepCounter");

    function showStep(stepKey) {
        quizSteps.forEach(step => {
            step.classList.remove("active");
            if (step.dataset.step === String(stepKey)) {
                step.classList.add("active");
            }
        });

        const stepNum = parseInt(stepKey, 10);
        if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 5) {
            currentStep = stepNum;
            progressWrapper.style.display = "block";
            progressFill.style.width = `${stepNum * 20}%`;
            if (stepCounter) stepCounter.textContent = `Pergunta ${stepNum} de 5`;
        } else {
            progressWrapper.style.display = "none";
        }
    }

    // Pergunta 1 já visível ao carregar a página, sem precisar de um clique extra
    showStep(1);

    // Seleção das opções de resposta
    document.querySelectorAll(".quiz-option").forEach(optionBtn => {
        optionBtn.addEventListener("click", (e) => {
            const btn = e.currentTarget;

            if (currentStep >= 1 && currentStep <= 3) {
                // Perguntas de dor — não pontuam, só identificam o problema principal
                dores[currentStep] = btn.dataset.dor || "";
            } else if (currentStep === 4 || currentStep === 5) {
                // Perguntas de intenção de compra — decidem a qualificação
                intentScores[currentStep] = parseInt(btn.dataset.pts || "0", 10);
            }

            if (currentStep < 5) {
                showStep(currentStep + 1);
            } else {
                finishQuiz();
            }
        });
    });

    // Botões Voltar
    document.querySelectorAll(".btn-back").forEach(backBtn => {
        backBtn.addEventListener("click", (e) => {
            const backStep = e.currentTarget.dataset.back;
            if (backStep === "hero") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                showStep(backStep);
            }
        });
    });

    // Identifica a dor principal, pela ordem de prioridade definida
    function getPrimaryDorPhrase() {
        const respondidas = [dores[1], dores[2], dores[3]].filter(Boolean);
        for (const tag of DOR_PRIORIDADE) {
            if (respondidas.includes(tag)) {
                return DOR_FRASES[tag];
            }
        }
        return DOR_FRASES.default;
    }

    // Calcula a pontuação da avaliação personalizada (58 a 85)
    function computeScore() {
        const raw =
            SCORE_PONTOS.q1[dores[1]] +
            SCORE_PONTOS.q2[dores[2]] +
            SCORE_PONTOS.q3[dores[3]];

        const score = Math.round(SCORE_MIN + (raw / SCORE_RAW_MAX) * (SCORE_MAX - SCORE_MIN));
        return Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
    }

    // Monta as 3 observações personalizadas de diagnóstico
    function getDiagnosticoObservacoes() {
        return [
            DIAGNOSTICO_Q1[dores[1]],
            DIAGNOSTICO_Q2[dores[2]],
            DIAGNOSTICO_Q3[dores[3]]
        ];
    }

    // Anima o círculo e a barra até ao valor final da pontuação
    function animateScore(score) {
        const scoreNumberEl = document.getElementById("scoreNumber");
        const scoreBarFillEl = document.getElementById("scoreBarFill");
        const scoreCircleFillEl = document.getElementById("scoreCircleFill");
        const scoreClassificationEl = document.getElementById("scoreClassification");

        const circumference = 2 * Math.PI * 52; // r=52, definido no SVG
        const offset = circumference - (score / 100) * circumference;

        // Força o reflow antes de animar, para a transição CSS funcionar sempre
        scoreCircleFillEl.style.transition = "none";
        scoreCircleFillEl.style.strokeDashoffset = circumference;
        void scoreCircleFillEl.offsetWidth;
        scoreCircleFillEl.style.transition = "stroke-dashoffset 0.8s ease";
        scoreCircleFillEl.style.strokeDashoffset = offset;

        scoreBarFillEl.style.width = "0%";
        void scoreBarFillEl.offsetWidth;
        scoreBarFillEl.style.width = `${score}%`;

        scoreNumberEl.textContent = score;
        scoreClassificationEl.textContent = getClassificacao(score);
    }

    // Preenche a lista "O que identificámos" com as observações personalizadas
    function renderDiagnostico() {
        const listEl = document.getElementById("diagnosisList");
        listEl.innerHTML = "";
        getDiagnosticoObservacoes().forEach(texto => {
            const li = document.createElement("li");
            li.textContent = texto;
            listEl.appendChild(li);
        });
    }

    // Contador regressivo de 3 a 1, depois redireciona automaticamente
    function startCountdownAndRedirect(whatsappUrl) {
        const countdownEl = document.getElementById("countdownNumber");
        let count = 3;
        countdownEl.textContent = count;

        const interval = setInterval(() => {
            count -= 1;
            if (count <= 0) {
                clearInterval(interval);
                // window.location.href evita bloqueio de pop-up mesmo fora do
                // clique direto do utilizador, ao contrário de window.open.
                window.location.href = whatsappUrl;
            } else {
                countdownEl.textContent = count;
            }
        }, 1000);
    }

    // Qualificação e direcionamento final
    function finishQuiz() {
        const qualificado = intentScores[4] > 0 && intentScores[5] > 0;

        if (qualificado) {
            const score = computeScore();
            const dorFrase = getPrimaryDorPhrase();
            const msg = `Olá, Eric. Acabei de concluir a avaliação da minha Presença Profissional Online. A minha presença apresenta um índice de ${score}/100. Gostaria de conhecer a proposta personalizada para melhorar a minha presença profissional (${dorFrase}).`;
            const whatsappUrl = buildWhatsappUrl(msg);

            const fallbackLink = document.getElementById("btnAnalysisWhatsappFallback");
            if (fallbackLink) fallbackLink.href = whatsappUrl;

            // Etapa 1: "a analisar as respostas..." durante ~1 segundo
            showStep("analyzing");
            if (quizCard) quizCard.scrollIntoView({ behavior: "smooth", block: "center" });

            setTimeout(() => {
                // Etapa 2: resultado personalizado com animação
                showStep("result-analysis");
                renderDiagnostico();
                animateScore(score);
                if (quizCard) quizCard.scrollIntoView({ behavior: "smooth", block: "center" });

                // Etapa 3: contador de 3 segundos e redirecionamento automático
                startCountdownAndRedirect(whatsappUrl);
            }, 1000);
        } else {
            // LEAD A NUTRIR -> Instagram
            const instagramBtn = document.getElementById("btnNurtureInstagram");
            if (instagramBtn) {
                instagramBtn.href = INSTAGRAM_URL;
            }
            showStep("result-nurture");
            if (quizCard) quizCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
});
