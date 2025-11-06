## Painel de Gestão de Aluguéis – Yggdrasil

### Descrição
O **Painel de Gestão de Aluguéis** é uma aplicação web desenvolvida para auxiliar locadores no gerenciamento de contratos, pagamentos e pendências de aluguel.  
O sistema apresenta gráficos financeiros, histórico de pagamentos e uma interface moderna e responsiva voltada à administração imobiliária.

### Tecnologias Utilizadas
- **Next.js** – Framework React para renderização no lado do servidor.  
- **React** – Biblioteca principal para construção da interface.  
- **TypeScript** – Tipagem estática para maior robustez e segurança.  
- **Firebase** – Autenticação e banco de dados em nuvem (Firestore).  
- **Tailwind CSS** – Estilização responsiva e padronizada.  
- **Recharts** – Exibição de gráficos interativos.  
- **Framer Motion** – Transições animadas entre telas.

### Estrutura do Projeto
- **/app** – Contém as páginas principais, incluindo dashboard, imóveis e pagamentos.  
- **/context** – Gerenciamento global de usuário.  
- **/lib** – Configurações e inicialização do Firebase.  
- **/components** – Componentes reutilizáveis de interface.

### Funcionalidades
- Login e autenticação de usuários.  
- Controle de contratos e pagamentos.  
- Exibição do fluxo mensal de aluguéis.  
- Resumo financeiro com totais recebidos e pendentes.  
- Interface totalmente responsiva.  
- Animações suaves e navegação fluida.

### Instalação e Execução
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/nome-do-repositorio.git
   ```
2. Acesse o diretório do projeto:
   ```bash
   cd nome-do-repositorio
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure o ambiente criando o arquivo `.env.local`:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
   ```
5. Execute o projeto:
   ```bash
   npm run dev
   ```
6. Acesse no navegador:
   ```
   http://localhost:3000
   ```

### Desenvolvedor
**Natanel A. De Assis**  
Desenvolvedor Full Stack  

### Sobre a Yggdrasil
A **Yggdrasil** é uma empresa voltada ao desenvolvimento de soluções tecnológicas inovadoras, com foco em automação, eficiência e design inteligente.  
Seu objetivo é oferecer sistemas personalizados que simplificam processos, otimizam a gestão e elevam o desempenho de negócios em diversas áreas, sempre com qualidade e segurança.

### Licença
**© Yggdrasil – Todos os direitos reservados.**  
Este software é de **propriedade privada da empresa Yggdrasil**.  
A redistribuição, cópia, modificação ou uso não autorizado, total ou parcial, é estritamente proibido.
