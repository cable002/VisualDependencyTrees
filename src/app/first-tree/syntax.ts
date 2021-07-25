

    export class SyntaxEntry  {

        public entryId:number;
        public questionId:number;  //early on this can just be the index of the word's pos. in the sentence
        public questionSubId:number;
        public IsQuestion:boolean; //not used
    
        public correctAnswerId:number;
        public correctAnswer:string;  //long form. May not need
        public correctShortAnswer:string;
        public questionType:string;
        public questionTypeLabel:string;
    
        public IsCorrect:boolean;
        public HasBeenTried:boolean;

        public userChoiceAnswerId:number;
        public userChoiceAnswer:string;  //long form. May not need
        public userChoiceShortAnswer:string;
    
        public OriginalWord:string;
        public lemmaText:string;
        public lemmaTextCoalesce:string;
        public allKnownOthersCoalesce:string[]; 
        public textContent:string;
        public pos:string;
        public case:string;
        public person:string;
        public number:string;
        public voice:string;
        public mood:string;
        public tense:string;
        public aspect:string;
        public gender:string;
        public dEheadTokenIndex:number;
        public distanceFromHead:number;
        public dElabel:string;
        public reciprocity:string;
        public proper:string;
    
        public text:object;  //content.text
        public lemma:object;
        public partOfSpeech:object; 
        public dependencyEdge:object;

        public sourceLangCode:string; //Added for when toggling languages on Syntax tab.  But may be needed for db storage
    
        constructor(){
            
        }
    
    
        
    }//end class SyntaxEntry
    