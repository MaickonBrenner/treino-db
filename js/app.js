import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBnDpmVOtspAe8Vvf4mmbdN-CQUyIzxMM0",
    authDomain: "treino-db-62275.firebaseapp.com",
    projectId: "treino-db-62275",
    storageBucket: "treino-db-62275.firebasestorage.app",
    messagingSenderId: "339409720980",
    appId: "1:339409720980:web:a36f2ac276f217e9fe0681",
    measurementId: "G-ZCVNR127LP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let userAtual = null;
let unsubscribe = null;

// Funções globais de Autenticação
window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    const authSection = document.getElementById('authSection');
    const appSection = document.getElementById('appSection');
    if (user) {
        userAtual = user;
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        document.getElementById('userName').innerText = `Olá, ${user.displayName.split(' ')[0]}!`;
        window.filtrar('Todos');
    } else {
        userAtual = null;
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        if (unsubscribe) unsubscribe();
    }
});

// Lógica de Dados (Salvar)
window.salvarTreino = async () => {
    const id = document.getElementById('treinoId').value;
    const exercicio = document.getElementById('exercicio').value;
    const peso = document.getElementById('peso').value;
    const repeticoes = document.getElementById('repeticoes').value;
    const tag = document.getElementById('tagTreino').value;

    if (!exercicio || !peso || !repeticoes) return alert("Preencha todos os campos!");

    const dados = {
        exercicio,
        peso: Number(peso),
        repeticoes: Number(repeticoes),
        tag,
        userId: userAtual.uid,
        data: new Date()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "treinos", id), { exercicio, peso: Number(peso), repeticoes: Number(repeticoes), tag });
            document.getElementById('treinoId').value = '';
        } else {
            await addDoc(collection(db, "treinos"), dados);
        }
        document.getElementById('exercicio').value = '';
        document.getElementById('peso').value = '';
        document.getElementById('repeticoes').value = '';
        document.getElementById('btnSalvar').innerText = "Salvar Registro";
    } catch (e) { console.error("Erro ao salvar: ", e); }
};

// Lógica de Filtro (Incluindo suporte a 'Geral' e 'Todos')
window.filtrar = (categoria) => {
    if (!userAtual) return;
    const pRef = collection(db, "treinos");
    let q = query(pRef, where("userId", "==", userAtual.uid), orderBy("data", "desc"));
    
    if (categoria !== 'Todos') {
        q = query(pRef, where("userId", "==", userAtual.uid), where("tag", "==", categoria), orderBy("data", "desc"));
    }

    if (unsubscribe) unsubscribe();
    unsubscribe = onSnapshot(q, (snapshot) => {
        const lista = document.getElementById('historico');
        lista.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id;
            const repsText = item.repeticoes ? ` | ${item.repeticoes} reps` : '';
            
            lista.innerHTML += `
                <div class="registro" style="border-left-color: ${getCor(item.tag)}">
                    <strong>${item.exercicio}</strong> - ${item.peso}kg${repsText} <br>
                    <small>${item.tag} | ${item.data?.toDate().toLocaleDateString()}</small>
                    <div class="actions">
                        <button class="btn-edit" onclick="prepararEdicao('${id}', '${item.exercicio}', ${item.peso}, ${item.repeticoes || 0}, '${item.tag}')">Editar</button>
                        <button class="btn-del" onclick="excluirTreino('${id}')">Excluir</button>
                    </div>
                </div>`;
        });
    });
};

window.prepararEdicao = (id, exercicio, peso, repeticoes, tag) => {
    document.getElementById('treinoId').value = id;
    document.getElementById('exercicio').value = exercicio;
    document.getElementById('peso').value = peso;
    document.getElementById('repeticoes').value = repeticoes;
    document.getElementById('tagTreino').value = tag;
    document.getElementById('btnSalvar').innerText = "Atualizar Registro";
    window.scrollTo(0,0);
};

window.excluirTreino = async (id) => {
    if(confirm("Excluir registro?")) await deleteDoc(doc(db, "treinos", id));
};

const getCor = (t) => {
    const paleta = { 
        'Geral': '#607D8B', 
        'T1': '#4CAF50', 
        'T2': '#2196F3', 
        'T3': '#FF9800', 
        'T4': '#E91E63', 
        'T5': '#9C27B0' 
    };
    return paleta[t] || '#9E9E9E';
};