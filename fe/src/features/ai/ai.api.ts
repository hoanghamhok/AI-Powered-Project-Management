import api from "../../api/client"

export const askAI =async (question:string,projectId:string)  => {
  const res = await api.post("/ai/ask", {
    question,
    projectId,
  });
  return res.data;
}