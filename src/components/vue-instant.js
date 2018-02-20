import { mixin as clickaway } from 'vue-clickaway'
export default {
    name: 'vueInstant',
    mixins: [ clickaway ],
    props: {
      'value': {
        type: String,
        required: true
      },
      'suggestions': {
        type: Array,
        required: true
      },
      'suggestionAttribute': {
        type: String,
        required: true
      },
      'placeholder': {
        type: String,
        default: 'write something...'
      },
      'minMatch': {
        type: Number,
        default: 2
      },
      'name': {
        type: String,
        default: 'vueInstant'
      },
      'autofocus': {
        type: Boolean,
        default: true
      },
      'disabled': {
        type: Boolean
      },
      'showAutocomplete': {
        type: Boolean,
        default: true
      },
      'suggestOnAllWords': {
        type: Boolean,
	    default: false
      }
    },
    data () {
      return {
        selectedEvent: null,
        selectedSuggest: null,
        inputChanged: false,
        suggestionsIsVisible: true,
        highlightedIndex: 0,
        highlightedIndexMax: 7,
        similiarData: [],
        placeholderVal: this.placeholder
      }
    },
    watch: {
      placeholder: function (val) {
        if (this.textValIsEmpty()) {
          this.placeholderVal = val
        }
      }
    },
    computed: {
      getPlaceholder () {
        if (this.inputChanged || this.textValIsEmpty()) {
          return this.placeholderVal
        }
      },
      modeIsFull () {
        return this.showAutocomplete
      },
      showSuggestions () {
        return this.similiarData.length >= this.minMatch
      },

      textVal: {
        get () {
          return this.value
        },
        set (v) {
          this.$emit('input', v)
        }
      }
    },
    methods: {
      decrementHighlightedIndex () {
        this.highlightedIndex -= 1
      },
      incrementHighlightedIndex () {
        this.highlightedIndex += 1
      },
      escapeAction () {
        this.clearHighlightedIndex()
        this.clearSimilarData()
        this.clearSelected()
        this.setBlur()
        this.emitEscape()
      },
      arrowRightAction () {
        this.setPlaceholderAndTextVal()
        this.emitKeyRight()
      },
      arrowDownAction () {
        if (this.arrowDownValidation()) {
          this.incrementHighlightedIndex()
          this.setPlaceholderAndTextVal()
          this.emitKeyDown()
        } else {
          this.clearHighlightedIndex()
        }
      },
      arrowUpAction () {
        if (this.highlightedIndex > 0) {
          this.decrementHighlightedIndex()
          this.setPlaceholderAndTextVal()
          this.emitKeyUp()
        } else {
          this.clearHighlightedIndex()
        }
      },
      enterAction () {
        this.setFinalTextValue()
        this.clearHighlightedIndex()
        this.clearSimilarData()
        this.emitEnter()
      },
      selectedAction (index) {
        this.highlightedIndex = index
        this.setFinalTextValue()
        this.clearPlaceholder()
        this.clearSimilarData()
        this.emitSelected()
      },
      addRegister (o) {
        if (this.isSimilar(o) && this.textValIsNotEmpty()) {
          this.addSuggestion(o)
        }
      },
      addSuggestion (o) {
        if (!this.findSuggestionTextIsRepited(o)) {
          this.addToSimilarData(o)
        }
      },
      addToSimilarData (o) {
        if (this.canAddToSimilarData()) {
          this.placeholderVal = this.letterProcess(o)
          this.selectedSuggest = o
          this.emitSelected()
          this.similiarData.unshift(o)
        }
      },
      setTextValue (e) {
        if (e.target.value.trim()) {
          this.textVal = e.target.value
          this.emitChange()
        }
      },
      setSelectedAsTextValue () {
        this.textVal = this.selected
      },
      setInitialTextValue () {
        this.textVal = this.value
      },
      setFinalTextValue () {
        if (this.finalTextValueValidation()) {
          this.setPlaceholderAndTextVal()
          this.emitChange()
        } else {
          this.clearAll()
        }
      },
      setPlaceholderAndTextVal () {
        if (typeof this.similiarData[this.highlightedIndex] !== 'undefined') {
          var suggest = this.similiarData[this.highlightedIndex]
          this.placeholderVal = suggest[this.suggestionAttribute]
          this.textVal = suggest[this.suggestionAttribute]
          this.selectedSuggest = suggest
          this.emitSelected()
        }
      },
      setInitialPlaceholder () {
        this.placeholderVal = this.placeholder
      },
      setBlur () {
        this.$el.blur()
      },
      getType () {
        return this.types.find(this.isSameType)
      },
      getClassHighlighted (index) {
        if (this.highlightedIndex === index) {
          var type = this.getType()
          return type.highlighClass
        }
      },
      letterProcess (o) {
        var remoteText = o[this.suggestionAttribute].split('')
        var inputText = this.textVal.split('')
        inputText.forEach(function (letter, key) {
          if (letter !== remoteText[key]) {
            remoteText[key] = letter
          }
        })
        return remoteText.join('')
      },
      findSuggests () {
        if (this.suggestionsPropIsDefined()) {
          this.suggestions.forEach(this.addRegister)
        }
      },
      arrowDownValidation () {
        return this.highlightedIndex < this.highlightedIndexMax &&
               this.highlightedIndex < (this.similiarData.length - 1)
      },
      lowerFirst (string) {
        return string.charAt(0).toLowerCase() + string.slice(1)
      },
      controlEvents () {
        var uncaptz = this.lowerFirst(this.selectedEvent + 'Action')
        var fnName = (this[uncaptz])
        if (this.fnExists(fnName)) {
          fnName()
        }
      },
      findRepited (similarItem, o) {
        return (similarItem[this.suggestionAttribute] ===
        o[this.suggestionAttribute])
      },
      findSuggestionTextIsRepited (o) {
        return this.similiarData.find(this.findRepited.bind(this, o))
      },
      finalTextValueValidation () {
        return typeof this.similiarData[this.highlightedIndex] !== 'undefined' ||
            this.placeholderVal === '' && this.highlightedIndex !== 0
      },
      isSimilar (o) {
          if (o) {
	   if ( this.suggestOnAllWords ) {
	      var isMatch = false;
	      var words = o[this.suggestionAttribute].split(" ");
	      var textValWords = this.textVal.split(" ");
	      if ( words.length > 0) {
		  words.forEach(function(word)  {
		      if ( textValWords.length > 0) {
			  textValWords.forEach(function(textValWord) {
			      if (word.toLowerCase().startsWith(textValWord.toLowerCase())) {
				  isMatch = true;
			      }
			  });
		      }
		      else if (word.toLowerCase().startsWith(this.textVal.toLowerCase())) {
			  isMatch = true;
		      }
		  });
		  return isMatch;
	      } 
	   }

           return o[this.suggestionAttribute]
        	  .toLowerCase()
		  .startsWith(this.textVal.toLowerCase())		  


        }
      },
      isSameType (o) {
        return o.name === this.type
      },
      fnExists (fnName) {
        return typeof fnName === 'function'
      },
      canAddToSimilarData () {
        return this.similiarData.length < this.highlightedIndexMax
      },
      suggestionsPropIsDefined () {
        return typeof this.suggestions !== 'undefined'
      },
      notArrowKeysEvent () {
        return this.selectedEvent !== 'ArrowUp' &&
                this.selectedEvent !== 'ArrowDown' && this.selectedEvent !== 'ArrowRight'
      },
      notEnterKeyEvent () {
        return this.selectedEvent !== 'Enter'
      },
      textValIsEmpty () {
        return this.textVal === ''
      },
      textValIsNotEmpty () {
        return this.textVal !== ''
      },
      reset () {
        this.clearValue()
        this.clearSelected()
        this.clearPlaceholder()
        this.clearSimilarData()
        this.clearSelectedSuggest()
        this.emitClear()
        this.emitSelected()
      },
      clearAll () {
        this.clearSelected()
        this.clearPlaceholder()
        this.clearSimilarData()
        this.clearSelectedSuggest()
      },
      clearValue () {
        this.textVal = ''
      },
      clearSelected () {
        this.selected = null
      },
      clearSelectedSuggest () {
        this.selectedSuggest = null
      },
      clearSimilarData () {
        this.similiarData = []
      },
      clearPlaceholder () {
        if (this.textValIsEmpty()) {
          this.clearSimilarData()
          this.setInitialPlaceholder()
        } else {
          this.placeholderVal = ''
        }
      },
      clearHighlightedIndex () {
        this.highlightedIndex = 0
      },
      changeText (e) {
        this.selectedEvent = e.code
        this.setTextValue(e)
        this.processChangeText()
        this.controlEvents(e)
      },
      processChangeText (e) {
        if (this.notEnterKeyEvent()) {
          this.inputChanged = true
          this.suggestionsIsVisible = true
          this.clearAllAndFindSuggest()
        }
      },
      clearAllAndFindSuggest () {
        if (this.notArrowKeysEvent()) {
          this.clearAll()
          this.findSuggests()
        }
      },
      away () {
        this.suggestionsIsVisible = false
        this.emitSelected()
      },
      emitChange () {
        // this.$emit('input', this.textVal)
      },
      emitClickInput (event) {
        this.$emit('click-input', event)
      },
      emitClickButton (event) {
        this.$emit('click-button', this.textVal)
      },
      emitEnter () {
        this.$emit('enter')
      },
      emitKeyUp () {
        this.$emit('key-up')
      },
      emitKeyDown () {
        this.$emit('key-down', this.selectedSuggest)
      },
      emitKeyRight () {
        this.$emit('key-right')
      },
      emitClear () {
        this.$emit('clear')
      },
      emitEscape () {
        this.$emit('escape')
      },
      emitSelected () {
        this.$emit('selected', this.selectedSuggest)
      }
    }
}