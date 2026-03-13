let favoritos = [];
let imagemAtualIndex = 0;
let imagensDoProduto = [];
let carrosselInterval; // Variável para controlar o tempo do carrossel

async function carregarProdutos() {
    try {
        const resposta = await fetch('./data/produtos.json'); 
        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error("Erro ao carregar o ficheiro JSON:", erro);
        return [];
    }
}

function alternarFavorito(id) {
    const index = favoritos.indexOf(id);
    if (index === -1) {
        favoritos.push(id);
    } else {
        favoritos.splice(index, 1);
    }
    const contador = document.getElementById('contagem-favoritos');
    if (contador) contador.innerText = favoritos.length;
    filtrarGeral(); 
}

async function filtrarGeral() {
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    const tipo = document.getElementById('filtro-tipo').value.toLowerCase();
    const todosProdutos = await carregarProdutos();

    const filtrados = todosProdutos.filter(p => {
        const matchesTermo = p.nome.toLowerCase().includes(termo) || 
                             (p.description && p.description.toLowerCase().includes(termo));
        const matchesTipo = tipo === 'todos' || (p.tipo && p.tipo.toLowerCase() === tipo);
        return matchesTermo && matchesTipo;
    });

    exibirCards(filtrados); 
}

function exibirCards(listaProdutos) {
    const container = document.getElementById('container-produtos');
    container.innerHTML = ''; 

    if (listaProdutos.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 col-span-full">Nenhum laço encontrado.</p>';
        return;
    }

    listaProdutos.forEach(p => {
        const estaNosFavoritos = favoritos.includes(p.id);
        const imgExibicao = Array.isArray(p.imagem) ? p.imagem[0] : p.imagem;
        
        const card = `
        <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition shadow-pink-100 relative group">
            <button onclick="alternarFavorito(${p.id})" 
                class="absolute top-2 right-2 z-20 p-2 rounded-full shadow-md transition-all ${estaNosFavoritos ? 'bg-pink-500 text-white' : 'bg-white text-pink-500 hover:bg-pink-50'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${estaNosFavoritos ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>
            ${p.destaque ? '<span class="absolute top-2 left-2 z-10 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">Destaque</span>' : ''}
            <div class="overflow-hidden h-64 cursor-pointer" onclick="abrirDetalhes(${p.id})">
                <img src="${imgExibicao}" alt="${p.nome}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" loading="lazy">
            </div>
            <div class="p-6">
                <h4 class="font-bold text-xl mb-2 text-gray-800 cursor-pointer hover:text-pink-500 transition-colors" onclick="abrirDetalhes(${p.id})">${p.nome}</h4>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${p.description || ''}</p>
                <div class="flex justify-between items-center mt-4">
                    <span class="text-pink-600 font-bold text-lg">R$ ${p.preco}</span>
                    <button onclick="enviarPedidoWhatsAppPersonalizado('${p.nome}', '${p.preco}')" class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 shadow-sm active:scale-95">Pedir agora</button>
                </div>
            </div>
        </div>`;
        container.innerHTML += card;
    });
}

// LÓGICA DO MODAL E CARROSSEL
async function abrirDetalhes(id) {
    const todosProdutos = await carregarProdutos();
    const p = todosProdutos.find(item => item.id === id);

    if (p) {
        imagensDoProduto = Array.isArray(p.imagem) ? p.imagem : [p.imagem];
        imagemAtualIndex = 0;
        atualizarImagemModal();

        const navCarrossel = document.getElementById('nav-carrossel');
        if (navCarrossel) {
            if (imagensDoProduto.length > 1) {
                navCarrossel.classList.remove('hidden');
                iniciarCarrosselAuto(); // Inicia o automático
            } else {
                navCarrossel.classList.add('hidden');
                pararCarrosselAuto();
            }
        }

        document.getElementById('modal-nome').innerText = p.nome;
        document.getElementById('modal-desc').innerText = p.description || "Sem descrição disponível.";
        document.getElementById('modal-preco').innerText = `R$ ${p.preco}`;
        document.getElementById('modal-tipo').innerText = p.tipo || "Geral";
        
        const btnZap = document.getElementById('modal-btn-zap');
        btnZap.onclick = () => enviarPedidoWhatsAppPersonalizado(p.nome, p.preco);

        document.getElementById('modal-detalhes').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function atualizarImagemModal() {
    const imgElement = document.getElementById('modal-img');
    if (imgElement && imagensDoProduto.length > 0) {
        imgElement.src = imagensDoProduto[imagemAtualIndex];
    }
}

function mudarImagem(direcao, manual = false) {
    if (manual) pararCarrosselAuto(); // Se clicar, para o automático para não bugar
    
    imagemAtualIndex += direcao;
    if (imagemAtualIndex < 0) imagemAtualIndex = imagensDoProduto.length - 1;
    if (imagemAtualIndex >= imagensDoProduto.length) imagemAtualIndex = 0;
    atualizarImagemModal();
}

function iniciarCarrosselAuto() {
    pararCarrosselAuto(); // Limpa qualquer um que esteja rodando
    carrosselInterval = setInterval(() => mudarImagem(1), 3000); // Muda a cada 3 segundos
}

function pararCarrosselAuto() {
    if (carrosselInterval) clearInterval(carrosselInterval);
}

function fecharModal() {
    document.getElementById('modal-detalhes').classList.add('hidden');
    document.body.style.overflow = 'auto';
    pararCarrosselAuto(); // Para o carrossel ao fechar
}

function enviarPedidoWhatsAppPersonalizado(nome, preco) {
    const telefone = "5511915072940"; 
    const mensagem = `Olá Luara! 👋\n\nGostaria de encomendar este modelo:\n🎀 *${nome}*\n💰 *Valor:* R$ ${preco}`;
    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
}

// Finalizar Carrinho (Lista Completa)
async function enviarPedidoWhatsApp() {
    const todosProdutos = await carregarProdutos();
    const itensSelecionados = todosProdutos.filter(p => favoritos.includes(p.id));
    
    if (itensSelecionados.length === 0) {
        alert("Selecione laços clicando no coração primeiro!");
        return;
    }

    const telefone = "5511915072940";
    let msg = "Olá Luara! 👋\n\nGostaria de encomendar estes modelos:\n\n";
    let total = 0;
    
    itensSelecionados.forEach(p => {
        msg += `🎀 *${p.nome}* - R$ ${p.preco}\n`;
        total += parseFloat(p.preco.replace(',', '.'));
    });

    msg += `\n💰 *Total:* R$ ${total.toFixed(2).replace('.', ',')}`;
    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(msg)}`, '_blank');
}

window.onclick = (e) => { if (e.target.id === 'modal-detalhes') fecharModal(); };
window.onload = () => filtrarGeral();