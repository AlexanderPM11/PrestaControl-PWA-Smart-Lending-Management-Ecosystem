FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["Prestacontrol.API/Prestacontrol.API.csproj", "Prestacontrol.API/"]
COPY ["Prestacontrol.Application/Prestacontrol.Application.csproj", "Prestacontrol.Application/"]
COPY ["Prestacontrol.Domain/Prestacontrol.Domain.csproj", "Prestacontrol.Domain/"]
COPY ["Prestacontrol.Infrastructure/Prestacontrol.Infrastructure.csproj", "Prestacontrol.Infrastructure/"]

RUN dotnet restore "Prestacontrol.API/Prestacontrol.API.csproj"

# Copy the rest of the code
COPY . .
WORKDIR "/src/Prestacontrol.API"
RUN dotnet build "Prestacontrol.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Prestacontrol.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .


ENTRYPOINT ["dotnet", "Prestacontrol.API.dll"]
