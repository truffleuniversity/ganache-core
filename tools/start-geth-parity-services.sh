GETH_SERVICE_PROCESS_ID=$( ps | grep 9711 | grep ethnode/geth | awk '{print $1;}' )
PARITY_SERVICE_PROCESS_ID=$( ps | grep 9713 | grep ethnode/parity | awk '{print $1;}' )

if [ -n "$GETH_SERVICE_PROCESS_ID" ] && [ -n "$PARITY_SERVICE_PROCESS_ID" ]; then
   echo "Geth and Parity processes are running"
else
   echo "Starting Geth and Parity processes"
   TEMP_ETHNODE="../../ethnode-truffle-testing"
   if [ -d "$TEMP_ETHNODE" ]; then
      echo "Detected Ethnode Truffle Testing Repo"
      pushd "$TEMP_ETHNODE"
      if [ ! -d "node_modules" ]; then
         npm install
      fi
   else
      echo "Cloning Ethnode Truffle Testing Repo"
      git clone git@github.com:trufflesuite/ethnode-truffle-testing.git "$TEMP_ETHNODE"
      pushd "$TEMP_ETHNODE"
      npm install
   fi
   ./start.sh &
   popd
   sleep 5
fi

npm test
echo "Done testing against Ganache, Geth and Parity!"

# Kill Geth and Parity processes
ps -ef | grep ethnode/geth | grep -v grep | awk '{print $2}' | xargs kill &> /dev/null
ps -ef | grep ethnode/parity | grep -v grep | awk '{print $2}' | xargs kill &> /dev/null
rm -rf $TEMP_ETHNODE
exit 0