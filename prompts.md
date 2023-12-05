# Prompts for Changing Chess Heuristics

These are some of the prompts I used to try to change the heuristics of the chess AI. I tried to make it effective as possible but changing the heuristics through the piece square tables and piece values did not work very well. I used the OpenAI JSON mode to get structured json output from the GPT-4 API.

### Prompt 1: Changing the Piece Square Tables

Given the following piece square tables, edit them to reflect the following user input:

{{user_input}}

{{piece_square_tables}}

Edit the individual values in the piece square tables. Output the name of the piece and the piece square table (as a 2d array) unde the keys `piece` and `piece_square_table`  in the structured json output.

### Prompt 2: Changing the Piece Values

Given the following piece values, edit them to reflect the following user input:

{{user_input}}

{{piece_values}}

Edit the individual values in the piece values. Output the name of the piece and the piece value under the keys `piece` and `piece_value` in the structured json output.

### Prompt 3: Changing the Piece Square Tables and Piece Values

Given the following piece square tables and piece values, edit them to reflect the following user input:

{{user_input}}

{{piece_square_tables}}

{{piece_values}}

Edit the individual values in the piece square tables and piece values. Output the name of the piece and the piece square table (as a 2d array) and piece value under the keys `piece`, `piece_square_table`, and `piece_value` in the structured json output.
