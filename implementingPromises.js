class MyPromise {


    constructor(executor) {
      this._resolutionQueue = []
      this._rejectionQueue = []
      this._state = "pending";
      this._value;
      this._rejectionReason;
      try {
        executor(this._resolve.bind(this), this._reject.bind(this));
      }
      catch(error) {
        this._reject(error);
      }
    }
    _runResolutionHandlers() {
      while (this._resolutionQueue.length > 0) {
        let resolution = this._resolutionQueue.shift();
        try {
          var handlerRet = resolution.handler(this._value);
        }
        catch(error) {
          resolution.promise._reject(error);
        }
        
        if (handlerRet && handlerRet instanceof MyPromise) {
          handlerRet.then((result) => {
            resolution.promise._resolve(result);
          }).catch((error) => {
            resolution.promise._reject(error);
          });
        }
        else {
            resolution.promise._resolve(handlerRet);
        }
      }
    }
    _runRejectionHandlers() {
      while (this._rejectionQueue.length > 0) {
        let rejection = this._rejectionQueue.shift();
        try {
          var handlerRet = rejection.handler(this._rejectionReason);
        }
        catch(error) {
          rejection.promise._reject(error);
        }
        if (handlerRet && handlerRet instanceof MyPromise) {
          handlerRet.then((result) => {
            rejection.promise._resolve(result); 
          }).catch((error) => {
            rejection.promise._reject(error);
          });
        }
        else {
            rejection.promise._resolve(handlerRet);
        }
      }
    }
    _resolve(value) {
      if (this._state === "pending") {
        this._value = value;
        this._runResolutionHandlers();
        this._state = "resolved";
      }
    }

    _reject(reason) {
      if (this._state === "pending") {
        this._rejectionReason = reason;
        this._runRejectionHandlers();
        this._state = "rejected";

        while (this._resolutionQueue.length > 0) {
          let resolution = this._resolutionQueue.shift();
          resolution.promise._reject(this._rejectionReason);
        }
      }
    }

    then(handler, rejectionHandler) {
      let promise = new MyPromise(() => {});
      this._resolutionQueue.push({handler,promise});
      if (typeof rejectionHandler === "function") {
        this._rejectionQueue.push({handler: rejectionHandler,promise});
      }
      if (this._state === "resolved") {
        this._runResolutionHandlers();
      }
      if (this._state === "rejected") {
        promise._reject(this._rejectionReason);
      }
      return promise;
    }

    catch(handler) {
      let promise = new MyPromise(() => {});
      this._rejectionQueue.push({handler,promise});
      
      if (this._state === "rejected") {
        this._runRejectionHandlers();
      }

      return promise;
    }
}

module.exports = MyPromise;
