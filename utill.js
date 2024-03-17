export const doSomeHeavyTask = async () => {
   const startTime = Date.now();
   const randomDelay = Math.random() * 5000;

   await new Promise((resolve, reject) => {
      setTimeout(() => {
         const randomError = Math.random();
         if (randomError < 0.2) {
            reject(new Error("An error occurred during heavy task."));
         } else {
            resolve();
         }
      }, randomDelay);
   });

   const endTime = Date.now();
   const timeTaken = endTime - startTime;

   return { message: "Heavy task completed successfully.", timeTaken };
};
