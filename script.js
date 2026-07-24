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

const WHATSAPP_NUMBER = "5581849116271";
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
    const btnHeroCta = document.getElementById("btnHeroCta");

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
        } else {
            progressWrapper.style.display = "none";
        }
    }

    // Botão único da landing page: revela o quiz e abre já na pergunta 1
    function startQuizFlow(e) {
        e.preventDefault();
        quizSection.classList.remove("is-hidden");
        showStep(1);
        if (quizCard) {
            quizCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    if (btnHeroCta) btnHeroCta.addEventListener("click", startQuizFlow);

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
                quizSection.classList.add("is-hidden");
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

    // Qualificação e direcionamento final
    function finishQuiz() {
        const qualificado = intentScores[4] > 0 && intentScores[5] > 0;

        if (qualificado) {
            // LEAD QUALIFICADO -> WhatsApp, com mensagem personalizada pela dor
            const whatsappBtn = document.getElementById("btnQualifiedWhatsapp");
            const dorFrase = getPrimaryDorPhrase();
            const msg = `Olá, fiz a avaliação gratuita de presença digital e percebi que ${dorFrase}. Gostaria de saber mais sobre como posso melhorar isso.`;
            const whatsappUrl = buildWhatsappUrl(msg);

            if (whatsappBtn) {
                whatsappBtn.href = whatsappUrl;
            }

            showStep("result-qualified");

            // Abre o WhatsApp automaticamente, ainda dentro do mesmo clique do
            // utilizador (evita que o bloqueador de pop-ups impeça a abertura).
            window.open(whatsappUrl, "_blank");
        } else {
            // LEAD A NUTRIR -> Instagram
            const instagramBtn = document.getElementById("btnNurtureInstagram");
            if (instagramBtn) {
                instagramBtn.href = INSTAGRAM_URL;
            }
            showStep("result-nurture");
        }

        if (quizCard) {
            quizCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
});
