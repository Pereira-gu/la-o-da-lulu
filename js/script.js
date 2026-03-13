let favoritos = [];
let imagemAtualIndex = 0;
let imagensDoProduto = [];
let carrosselInterval;

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
    
    // Atualiza a visualização para mostrar o novo estado do botão
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
        const estaNoCarrinho = favoritos.includes(p.id);
        const imgExibicao = Array.isArray(p.imagem) ? p.imagem[0] : p.imagem;
        
        const card = `
        <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition shadow-pink-100 relative group">
            ${p.destaque ? '<span class="absolute top-2 left-2 z-10 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">Destaque</span>' : ''}
            
            <div class="overflow-hidden h-64 cursor-pointer" onclick="abrirDetalhes(${p.id})">
                <img src="${imgExibicao}" alt="${p.nome}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" loading="lazy">
            </div>
            
            <div class="p-6">
                <h4 class="font-bold text-xl mb-2 text-gray-800 cursor-pointer hover:text-pink-500 transition-colors" onclick="abrirDetalhes(${p.id})">
                    ${p.nome}
                </h4>
                
                <div class="flex justify-between items-center mt-4">
                    <span class="text-pink-600 font-bold text-lg">R$ ${p.preco}</span>
                    <button onclick="alternarFavorito(${p.id})" 
                        class="px-4 py-2 rounded-lg text-sm shadow-sm active:scale-95 transition-colors ${estaNoCarrinho ? 'bg-gray-200 text-gray-600' : 'bg-pink-500 text-white hover:bg-pink-600'}">
                        ${estaNoCarrinho ? 'Remover' : '🛒 Adicionar'}
                    </button>
                </div>
            </div>
        </div>`;
        container.innerHTML += card;
    });
}

async function abrirDetalhes(id) {
    const todosProdutos = await carregarProdutos();
    const p = todosProdutos.find(item => item.id === id);

    if (p) {
        const estaNoCarrinho = favoritos.includes(p.id);
        imagensDoProduto = Array.isArray(p.imagem) ? p.imagem : [p.imagem];
        imagemAtualIndex = 0;
        atualizarImagemModal();

        const navCarrossel = document.getElementById('nav-carrossel');
        if (navCarrossel) {
            if (imagensDoProduto.length > 1) {
                navCarrossel.classList.remove('hidden');
                iniciarCarrosselAuto();
            } else {
                navCarrossel.classList.add('hidden');
            }
        }

        document.getElementById('modal-nome').innerText = p.nome;
        document.getElementById('modal-desc').innerText = p.description || "Sem descrição disponível.";
        document.getElementById('modal-preco').innerText = `R$ ${p.preco}`;
        
        const btnZap = document.getElementById('modal-btn-zap');
        btnZap.innerText = estaNoCarrinho ? 'Remover do Carrinho' : '🛒 Adicionar ao Carrinho';
        btnZap.className = `w-full py-4 rounded-xl font-bold transition shadow-lg ${estaNoCarrinho ? 'bg-gray-200 text-gray-700' : 'bg-pink-500 text-white hover:bg-pink-600'}`;
        
        btnZap.onclick = () => {
            alternarFavorito(p.id);
            fecharModal();
        };

        document.getElementById('modal-detalhes').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function iniciarCarrosselAuto() {
    pararCarrosselAuto();
    carrosselInterval = setInterval(() => mudarImagem(1), 3000);
}

function pararCarrosselAuto() {
    if (carrosselInterval) clearInterval(carrosselInterval);
}

function mudarImagem(direcao, manual = false) {
    if (manual) pararCarrosselAuto();
    imagemAtualIndex += direcao;
    if (imagemAtualIndex < 0) imagemAtualIndex = imagensDoProduto.length - 1;
    if (imagemAtualIndex >= imagensDoProduto.length) imagemAtualIndex = 0;
    atualizarImagemModal();
}

function atualizarImagemModal() {
    document.getElementById('modal-img').src = imagensDoProduto[imagemAtualIndex];
}

function fecharModal() {
    document.getElementById('modal-detalhes').classList.add('hidden');
    document.body.style.overflow = 'auto';
    pararCarrosselAuto();
}

async function enviarPedidoWhatsApp() {
    const todosProdutos = await carregarProdutos();
    const itensSelecionados = todosProdutos.filter(p => favoritos.includes(p.id));
    
    if (itensSelecionados.length === 0) {
        alert("O seu carrinho está vazio!");
        return;
    }

    const telefone = "5511948689109";
    let msg = "Olá Luara! 👋\n\nGostaria de encomendar estes modelos do meu carrinho:\n\n";
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