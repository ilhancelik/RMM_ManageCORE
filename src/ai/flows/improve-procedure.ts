// src/ai/flows/improve-procedure.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for improving procedures based on execution logs.
 *
 * - improveProcedure - Analyzes procedure execution logs and suggests improvements, including safety checks.
 * - ImproveProcedureInput - The input type for the improveProcedure function.
 * - ImproveProcedureOutput - The return type for the improveProcedure function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveProcedureInputSchema = z.object({
  procedureScript: z
    .string()
    .describe('The script of the procedure to be improved.'),
  executionLogs: z
    .string()
    .describe('The execution logs of the procedure.'),
});
export type ImproveProcedureInput = z.infer<typeof ImproveProcedureInputSchema>;

const ImproveProcedureOutputSchema = z.object({
  improvedScript: z
    .string()
    .describe('The improved script with enhanced safety checks.'),
  explanation: z
    .string()
    .describe('An explanation of the improvements made and the safety checks added.'),
});
export type ImproveProcedureOutput = z.infer<typeof ImproveProcedureOutputSchema>;

export async function improveProcedure(input: ImproveProcedureInput): Promise<ImproveProcedureOutput> {
  return improveProcedureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveProcedurePrompt',
  input: {schema: ImproveProcedureInputSchema},
  output: {schema: ImproveProcedureOutputSchema},
  prompt: `You are an expert system administrator. You will analyze the execution logs of a procedure and suggest improvements to the script, including safety checks, to help prevent unintended negative impacts on managed computers.

Procedure Script:
{{{procedureScript}}}

Execution Logs:
{{{executionLogs}}}

Based on the provided script and execution logs, suggest an improved script with enhanced safety checks. Also, provide a clear explanation of the improvements made and the safety checks added.

Ensure that the improved script is robust and minimizes the risk of causing harm to the managed computers. Consider potential edge cases and error conditions, and incorporate appropriate error handling mechanisms.
`,
});

const improveProcedureFlow = ai.defineFlow(
  {
    name: 'improveProcedureFlow',
    inputSchema: ImproveProcedureInputSchema,
    outputSchema: ImproveProcedureOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
