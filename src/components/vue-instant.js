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
        type: [Array, Promise],
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
        default: 1
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
      },
      'selectOnExact': {
        type: Boolean,
	      default: true
      },
      'maxLimit': {
        type: Number,
	      default: 0
      }
    },
    data () {
      return {
        selectedEvent: null,
        selectedSuggest: null,
        inputChanged: false,
        isSuggestionAsync: false,
        suggestionsIsVisible: true,
        highlightedIndex: 0,
        similiarData: [],
        placeholderVal: this.placeholder,
        isLoading: false
      }
    },
    watch: {
      placeholder: function (val) {
        if (this.textValIsEmpty()) {
          this.placeholderVal = val
        }
      },
      suggestions: function (val) {
        this.handleNewSuggestion(val)
        this.findSuggests()
        this.onExact()
      }
    },
    computed: {
      getPlaceholder () {
        if (this.inputChanged || this.textValIsEmpty()) {
          return this.placeholderVal
        }
      },
      showSuggestions () {
        return this.showAutocomplete && this.suggestionsIsVisible && this.similiarData.length >= this.minMatch
      }
    },
    created () {
      this.textVal = this.value
      this.handleNewSuggestion()
    },
    methods: {
      decrementHighlightedIndex () {
        this.highlightedIndex -= 1
      },
      incrementHighlightedIndex () {
        this.highlightedIndex += 1
      },
      handleNewSuggestion (val = this.suggestions) {
        this.isSuggestionAsync = Promise.resolve(val) == val
        if (this.isSuggestionAsync) {
          this.isLoading = true
          val.then(results => this.isLoading = false)
        }
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
          // this.placeholderVal = this.letterProcess(o)
          this.selectedSuggest = o
          // this.emitSelected()
          this.similiarData.unshift(o)
        }
      },
      setTextValue (e) {
        if (e.target.value.trim()) {
          this.textVal = e.target.value
          this.emitChange()
        }
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
      onExact () {
        const values = this.similiarData.map(item => item[this.suggestionAttribute])
        const index = values.findIndex(v => this.textVal === v)
        if (index !== -1) {
          this.highlightedIndex = index;
          this.selectedSuggest = this.similiarData[index]
          this.clearPlaceholder()
          this.emitSelected()
          if (this.similiarData.length <= 1) {
            this.suggestionsIsVisible = false
          }
          return true
        }
        return false
      },
      setInitialPlaceholder () {
        this.placeholderVal = this.placeholder
      },
      setBlur () {
        this.$el.blur()
      },
      isHighlighted (index) {
        return this.highlightedIndex === index
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
          if (this.isSuggestionAsync) {
            return this.suggestions.then(results => {
              results.forEach(this.addRegister)
              this.setPlaceholderVal()
            })
          }
          this.suggestions.forEach(this.addRegister)
          this.setPlaceholderVal()
        }
      },
      setPlaceholderVal () {
          var suggest = this.similiarData[this.highlightedIndex]
          if (suggest) this.placeholderVal = suggest[this.suggestionAttribute]
      },
      arrowDownValidation () {
        return this.highlightedIndex < (this.similiarData.length - 1)
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
        return (similarItem[this.suggestionAttribute] === o[this.suggestionAttribute])
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
        if (this.maxLimit) return this.similiarData.length < this.maxLimit
        return true
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
        this.processChangeText(e)
        this.controlEvents(e)
      },
      processChangeText (e) {
        if (this.notEnterKeyEvent()) {
          if (this.selectOnExact && this.onExact()) return
          this.$emit('input', this.textVal)
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
        // this.emitSelected()
      },
      inputClick (e) {
        this.suggestionsIsVisible = true
        this.emitClickInput(e)
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