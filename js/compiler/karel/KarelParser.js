/*
 * File: KarelParser.js
 * --------------------
 * This file implements a parser for the Karel language.
 */

function KarelParser() {
   Parser.call(this);
   this.scanner.addWordCharacters("_");
   this.operators = { };
   this.defineOperators();
}
KarelParser.prototype = new XParser;
KarelParser.prototype.constructor = KarelParser;

KarelParser.prototype.defineOperators = function() {
   this.definePrefixOperator("(", this.parenOperator, 0, "RIGHT");
   this.definePrefixOperator("!", this.prefixOperator, 100);
   this.defineInfixOperator("(", this.applyOperator, 110, "RIGHT");
   this.defineInfixOperator("&&", this.infixOperator, 30);
   this.defineInfixOperator("||", this.infixOperator, 20);
};

KarelParser.statementForms = { };


KarelParser.statementForms["if"] = function(parser) {
   parser.verifyToken("(");
   var exp = parser.readPredicate();
   parser.verifyToken(")");
   var s1 = parser.readStatement();
   var token = parser.nextToken();
   if (token == "else") {
      return [ "if", exp, s1, parser.readStatement() ];
   } else {
      parser.saveToken(token);
      return [ "if", exp, s1 ];
   }
};

KarelParser.statementForms["while"] = function(parser) {
   parser.verifyToken("(");
   var exp = parser.readPredicate();
   parser.verifyToken(")");
   return [ "while", exp, parser.readStatement() ];
};

KarelParser.statementForms["repeat"] = function(parser) {
   parser.verifyToken("(");
   var token = parser.nextToken();
   if (TokenScanner.getTokenType(token) != TokenScanner.NUMBER) {
      throw new Error("The repeat statement requires an integer");
   }
   parser.verifyToken(")");
   return [ "repeat", TokenScanner.getNumber(token), parser.readStatement() ];
};

KarelParser.prototype.readFunction = function() {
   this.verifyToken("function");
   var name = this.nextToken();
   if (!this.scanner.isValidIdentifier(name)) {
      throw new Error("\"" + name + "\" is not a legal function name");
   }
   this.verifyToken("(");
   this.verifyToken(")");
   this.verifyToken("{");
   this.saveToken("{");
   return ["function", name, this.readStatement()];
};

KarelParser.prototype.readStatement = function() {
   var token = this.nextToken();
   if (token == "{") {
      var block = [ "block" ];
      while (true) {
         token = this.nextToken();
         if (token == "}") break;
         this.saveToken(token);
         var stmt = this.readStatement();
         block.push(stmt);
      }
      return block;
   }
   var prop = KarelParser.statementForms[token];
   if (prop) return prop(this);
   this.verifyToken("(");

   // Check if there are parameters
   var params = [];
   var nextToken = this.nextToken();
   if (nextToken != ")") {
      this.saveToken(nextToken);
      while (true) {
         var param = this.readParameter();
         params.push(param);
         nextToken = this.nextToken();
         if (nextToken == ")") break;
         if (nextToken != ",") {
            throw new Error("Expected ',' or ')' but found \"" + nextToken + "\"");
         }
      }
   }

   this.verifyToken(";");
   return [ "stmt", [ "call", token, params ] ];
};

KarelParser.prototype.readParameter = function() {
   var token = this.nextToken();
   var tokenType = TokenScanner.getTokenType(token);

   if (tokenType == TokenScanner.STRING) {
      return ["string", TokenScanner.getString(token)];
   } else if (tokenType == TokenScanner.NUMBER) {
      return ["number", TokenScanner.getNumber(token)];
   } else if (this.scanner.isValidIdentifier(token)) {
      return ["identifier", token];
   } else {
      throw new Error("Invalid parameter: " + token);
   }
};

KarelParser.prototype.readPredicate = function() {
   return this.readE(0);
};
