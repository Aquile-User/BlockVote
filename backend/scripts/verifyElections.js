// Script para verificar el estado actual de las elecciones y los resultados
const ethers = require("ethers");
require("dotenv").config();

async function main() {
  try {
    console.log("🔍 Verificando elecciones en la blockchain...");
    const provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL
    );
    const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
    const abi = votingJson.abi;

    // Leer el contrato de votación
    const votingContract = new ethers.Contract(
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      abi,
      provider
    );

    // Obtener el número de elecciones
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    console.log(`Número total de elecciones: ${nextId - 1}`);

    // Listar todas las elecciones
    console.log("\n📋 Lista de elecciones:");
    console.log("----------------------------");

    for (let i = 1; i < nextId; i++) {
      try {
        const [name, candidates, startTimeBI, endTimeBI, disabled] =
          await votingContract.getElection(i);

        // Convertir BigInt a Number
        const startTime = Number(startTimeBI);
        const endTime = Number(endTimeBI);

        // Obtener resultados
        const results = {};
        let totalVotes = 0;

        for (const candidate of candidates) {
          const votesBN = await votingContract.getVoteCount(i, candidate);
          const votes = Number(votesBN);
          results[candidate] = votes;
          totalVotes += votes;
        }

        const now = Math.floor(Date.now() / 1000);
        let status = "Próxima";

        if (disabled) {
          status = "Deshabilitada";
        } else if (now >= startTime && now <= endTime) {
          status = "Activa";
        } else if (now > endTime) {
          status = "Finalizada";
        }

        console.log(`Elección #${i}: ${name}`);
        console.log(`Estado: ${status}`);
        console.log(
          `Tiempo: ${new Date(startTime * 1000).toLocaleString()} - ${new Date(
            endTime * 1000
          ).toLocaleString()}`
        );
        console.log(`Candidatos: ${candidates.join(", ")}`);
        console.log(`Votos totales: ${totalVotes}`);

        if (totalVotes > 0) {
          console.log("Resultados:");
          for (const [candidate, votes] of Object.entries(results)) {
            const percentage =
              totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
            console.log(`  - ${candidate}: ${votes} votos (${percentage}%)`);
          }
        }
      } catch (error) {
        console.error(`Error al procesar la elección #${i}:`, error.message);
      }

      console.log("----------------------------");
    }
  } catch (error) {
    console.error("Error al verificar elecciones:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
